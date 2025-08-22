import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import { DatabaseService } from './db';
import { YachtMatcher } from './matcher';
import { QuoteCalculator } from './quote';
import { EmailService } from './email';
import { SeedService } from './seed';
import {
  CreateTenantRequestSchema,
  SearchYachtsRequestSchema,
  CreateLeadRequestSchema,
  CalculateQuoteRequestSchema,
  IngestEmailRequestSchema
} from './types';
import * as dotenv from 'dotenv';
import { monitoring } from './monitoring';
import { BackupService } from './backup';
import { AuditService } from './services/audit';
import { MetricsService } from './services/metrics';
import { IdempotencyService } from './services/idempotency';
import { DeadLetterService } from './services/deadletter';
import { RetryService } from './services/retry';
import { DashboardService } from './services/dashboard';
import { SecurityUtils } from './utils/security';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '5000');
const HOST = '0.0.0.0';
const ADMIN_KEY = process.env.ADMIN_KEY || 'yacht-brain-prod-2025-secure-key';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
  ['http://localhost:3000', 'https://localhost:3000'];

// Initialize services
const db = new DatabaseService();
const matcher = new YachtMatcher(db);
const quoteCalc = new QuoteCalculator();

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
});

// Initialize all services
const emailService = new EmailService(db, fastify.log);
const seedService = new SeedService(db);
const backupService = new BackupService(db);

// Production hardening services
const auditService = new AuditService(db);
const metricsService = new MetricsService();
const idempotencyService = new IdempotencyService(db);
const deadLetterService = new DeadLetterService(db);
const retryService = new RetryService();
const dashboardService = new DashboardService(db);

// Register plugins with security settings
fastify.register(cors, {
  origin: ALLOWED_ORIGINS,
  credentials: true
});
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  allowList: ['127.0.0.1']
});

// Queue for background jobs (simple in-memory queue)
const emailQueue: Array<{ job: any; retries: number }> = [];

// Process email queue
setInterval(async () => {
  if (emailQueue.length === 0) return;
  
  const item = emailQueue.shift();
  if (!item) return;

  const success = await emailService.sendEmail(item.job);
  
  if (!success && item.retries < 3) {
    item.retries++;
    emailQueue.push(item);
    fastify.log.warn({ retries: item.retries }, 'Email failed, retrying');
  }
}, 5000);

// Middleware for tenant validation
fastify.addHook('preHandler', async (request, reply) => {
  const excludedPaths = ['/health'];
  const adminPaths = ['/admin/tenant', '/admin/yachts/seed', '/admin/status', '/admin/backup', '/admin/export', '/admin/yachts/upload', '/admin/metrics', '/admin/audit', '/admin/dead-letters', '/admin/maintenance', '/admin/dashboard'];
  
  if (excludedPaths.includes(request.url)) {
    return;
  }

  if (request.url.startsWith('/admin/') || request.url.startsWith('/dashboard/metrics/') || request.url.startsWith('/dashboard/live/') || request.url.startsWith('/dashboard/export/')) {
    const adminKey = request.headers['x-admin-key'];
    if (adminKey !== ADMIN_KEY) {
      reply.code(401).send({ error: 'Invalid admin key' });
      return;
    }
    return;
  }

  const tenantId = request.headers['x-tenant-id'];
  if (!tenantId) {
    reply.code(400).send({ error: 'X-Tenant-Id header required' });
    return;
  }

  const tenant = db.getTenant(tenantId as string);
  if (!tenant) {
    reply.code(404).send({ error: 'Tenant not found' });
    return;
  }

  (request as any).tenantId = tenantId;
});

// Routes - Headless mode: Return 400 for root access
fastify.get('/', async (request, reply) => {
  reply.code(400).send({ error: 'API only' });
});

fastify.get('/health', async () => monitoring.getHealthStatus());

// Integration endpoints for headless mode

// Form-to-lead normalization endpoint
fastify.post('/integrations/form-to-lead', async (request, reply) => {
  try {
    const tenantId = (request as any).tenantId;
    const formData = request.body as any;
    
    // Normalize form data to standard lead format
    const normalizedData = {
      email: formData.email || formData.Email || formData.customerEmail || formData.contactEmail,
      name: formData.name || formData.Name || formData.fullName || formData.customerName,
      phone: formData.phone || formData.Phone || formData.phoneNumber || formData.contactPhone || null,
      notes: formData.notes || formData.message || formData.description || formData.requirements || 'Form submission',
      partySize: parseInt(formData.partySize || formData.guests || formData.numberOfGuests || formData.pax) || 2,
      location: formData.location || formData.destination || formData.charterArea || null,
      dates: formData.dates || formData.preferredDates || formData.travelDates || null,
      budget: parseInt(formData.budget || formData.weeklyBudget || formData.charterBudget) || null
    };

    // Validate required fields
    if (!normalizedData.email) {
      reply.code(400).send({ error: 'Email is required' });
      return;
    }

    // Create lead via existing endpoint logic
    const lead = db.createLead({
      ...normalizedData,
      tenantId,
      status: 'new'
    });

    db.logEvent({
      tenantId,
      type: 'form_to_lead',
      payload: JSON.stringify({ leadId: lead.id, source: 'form_integration' })
    });

    return { leadId: lead.id, status: 'ok' };
  } catch (error) {
    fastify.log.error(error);
    reply.code(400).send({ error: 'Invalid form data' });
  }
});

// Webhook dispatcher endpoint
fastify.post('/integrations/webhook', async (request, reply) => {
  try {
    const tenantId = (request as any).tenantId;
    const { event, payload } = request.body as { event: string; payload: any };
    
    // Store webhook event
    const webhookEvent = db.logEvent({
      tenantId,
      type: 'webhook_dispatch',
      payload: JSON.stringify({ event, payload, timestamp: new Date().toISOString() })
    });

    // TODO: Implement actual webhook delivery with retry logic
    // For now, just log the webhook attempt
    fastify.log.info({ tenantId, event, payload }, 'Webhook dispatch queued');

    return { success: true, eventId: webhookEvent.id };
  } catch (error) {
    fastify.log.error(error);
    reply.code(400).send({ error: 'Invalid webhook data' });
  }
});

// Admin routes
fastify.post('/admin/tenant', async (request, reply) => {
  try {
    const data = CreateTenantRequestSchema.parse(request.body);
    const tenant = db.createOrUpdateTenant(data);
    
    db.logEvent({
      tenantId: tenant.id,
      type: 'tenant_created',
      payload: JSON.stringify({ tenantId: tenant.id, name: tenant.name })
    });

    return { success: true, tenant };
  } catch (error) {
    fastify.log.error(error);
    reply.code(400).send({ error: 'Invalid request data' });
  }
});

fastify.post('/admin/yachts/seed', async (request, reply) => {
  try {
    const tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) {
      reply.code(400).send({ error: 'X-Tenant-Id header required for seeding' });
      return;
    }

    const count = seedService.seedYachts(tenantId);
    
    db.logEvent({
      tenantId,
      type: 'yachts_seeded',
      payload: JSON.stringify({ count })
    });

    return { success: true, seeded: count };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ error: 'Failed to seed yachts' });
  }
});

// Yacht search endpoint
fastify.get('/yachts', async (request) => {
  const tenantId = (request as any).tenantId;
  const filters = SearchYachtsRequestSchema.parse(request.query);
  
  const searchResult = db.searchYachts(tenantId, filters);
  
  db.logEvent({
    tenantId,
    type: 'yacht_search',
    payload: JSON.stringify({ filters, resultCount: searchResult.total })
  });

  return { 
    items: searchResult.items, 
    total: searchResult.total, 
    limit: filters.limit, 
    offset: filters.offset 
  };
});

// Lead creation endpoint
fastify.post('/lead', async (request, reply) => {
  try {
    const tenantId = (request as any).tenantId;
    const data = CreateLeadRequestSchema.parse(request.body);
    
    // Create lead
    const lead = db.createLead({
      ...data,
      tenantId,
      status: 'new'
    });

    // Match yachts
    const matches = matcher.matchYachts(
      tenantId,
      data.notes,
      data.partySize,
      data.location,
      true
    );

    const candidates = matches.slice(0, 10).map(m => m.yacht);
    
    // Calculate quotes for top candidates and queue email
    if (candidates.length > 0) {
      const area = data.location || candidates[0].area;
      
      // Generate quotes for top 4 yachts
      const candidatesWithQuotes = candidates.slice(0, 4).map(yacht => {
        const quote = quoteCalc.calculateQuote(yacht, 1, 25, undefined, 0, 0, []);
        
        // Save quote to database
        const savedQuote = db.createQuote({
          tenantId,
          yachtId: yacht.id!,
          basePrice: quote.base,
          apa: quote.apaAmount,
          vat: quote.vatAmount,
          extras: quote.extrasTotal,
          total: quote.total,
          currency: yacht.currency
        });

        return { yacht, quote };
      });

      // Queue email for background processing
      emailQueue.push({
        job: {
          tenantId,
          leadId: lead.id,
          customerEmail: data.email,
          customerName: data.name || 'Valued Customer',
          yachtCandidates: candidatesWithQuotes
        },
        retries: 0
      });

      // Log lead processing
      db.logEvent({
        tenantId,
        type: 'lead_processed',
        payload: JSON.stringify({
          leadId: lead.id,
          matchCount: matches.length,
          quotesGenerated: candidatesWithQuotes.length
        })
      });
    }

    return {
      success: true,
      lead,
      matchCount: matches.length,
      candidates: candidates.slice(0, 5)
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(400).send({ error: 'Invalid request data' });
  }
});

// Quote calculation endpoint
fastify.post('/quote/calc', async (request, reply) => {
  try {
    const tenantId = (request as any).tenantId;
    const data = CalculateQuoteRequestSchema.parse(request.body);
    
    const yacht = db.getYacht(data.yachtId);
    if (!yacht) {
      reply.code(404).send({ error: 'Yacht not found' });
      return;
    }

    const quote = quoteCalc.calculateQuote(
      yacht, 
      data.weeks, 
      data.apaPct, 
      data.vatPct, 
      data.gratuityPct, 
      data.deliveryFee, 
      data.extras
    );
    
    // Save quote to database
    const savedQuote = db.createQuote({
      tenantId,
      yachtId: yacht.id!,
      basePrice: quote.base,
      apa: quote.apaAmount,
      vat: quote.vatAmount,
      extras: quote.extrasTotal,
      total: quote.total,
      currency: yacht.currency
    });

    db.logEvent({
      tenantId,
      type: 'quote_calculated',
      payload: JSON.stringify({ quoteId: savedQuote.id, yachtId: yacht.id })
    });

    return quote;
  } catch (error) {
    fastify.log.error(error);
    reply.code(400).send({ error: 'Invalid request data' });
  }
});

// Email ingestion endpoint
fastify.post('/ingest/email', async (request, reply) => {
  try {
    const tenantId = (request as any).tenantId;
    const data = IngestEmailRequestSchema.parse(request.body);
    
    // Extract party size from email
    const partyMatch = data.body.match(/(\d+)\s*(people|guests|persons|pax)/i);
    const partySize = partyMatch ? parseInt(partyMatch[1]) : 4;
    
    // Extract location from email
    const locationRegex = /(mediterranean|caribbean|bahamas|greek islands|french riviera|croatia|turkey)/i;
    const locationMatch = data.body.match(locationRegex);
    const location = locationMatch ? locationMatch[1] : null;

    // Create lead from email
    const lead = db.createLead({
      tenantId,
      email: data.from,
      name: data.from.split('@')[0],
      notes: `${data.subject}: ${data.body}`,
      partySize,
      location,
      status: 'new'
    });

    db.logEvent({
      tenantId,
      type: 'email_ingested',
      payload: JSON.stringify({ leadId: lead.id, from: data.from })
    });

    return { success: true, lead };
  } catch (error) {
    fastify.log.error(error);
    reply.code(400).send({ error: 'Invalid email data' });
  }
});

// Admin status endpoint
fastify.get('/admin/status', async () => {
  const status = monitoring.getHealthStatus();
  return status;
});

// Backup endpoint
fastify.post('/admin/backup', async () => {
  const backup = backupService.createBackup();
  return { success: true, backup };
});

// Production hardening endpoints

// Admin: Metrics endpoint
fastify.get('/admin/metrics', async (request, reply) => {
  const adminKey = request.headers['x-admin-key'] as string;
  if (adminKey !== ADMIN_KEY) {
    reply.code(401).send({ error: 'Admin key required' });
    return;
  }

  return {
    counters: metricsService.getCounters(),
    prometheus: metricsService.getPrometheusMetrics(),
    timestamp: new Date().toISOString()
  };
});

// Admin: Audit logs endpoint  
fastify.get('/admin/audit/:tenantId', async (request, reply) => {
  const adminKey = request.headers['x-admin-key'] as string;
  if (adminKey !== ADMIN_KEY) {
    reply.code(401).send({ error: 'Admin key required' });
    return;
  }

  const { tenantId } = request.params as { tenantId: string };
  const limit = parseInt((request.query as any).limit || '100');
  const offset = parseInt((request.query as any).offset || '0');

  const logs = auditService.getAuditLogs(tenantId, limit, offset);
  return { logs };
});

// Admin: Dead letter queue endpoint
fastify.get('/admin/dead-letters/:tenantId', async (request, reply) => {
  const adminKey = request.headers['x-admin-key'] as string;
  if (adminKey !== ADMIN_KEY) {
    reply.code(401).send({ error: 'Admin key required' });
    return;
  }

  const { tenantId } = request.params as { tenantId: string };
  const limit = parseInt((request.query as any).limit || '50');

  const deadLetters = deadLetterService.getDeadLetters(tenantId, limit);
  return { deadLetters };
});

// Admin: System maintenance endpoint
fastify.post('/admin/maintenance', async (request, reply) => {
  const adminKey = request.headers['x-admin-key'] as string;
  if (adminKey !== ADMIN_KEY) {
    reply.code(401).send({ error: 'Admin key required' });
    return;
  }

  const { action } = request.body as { action: string };
  const results: any = {};

  try {
    switch (action) {
      case 'cleanup_expired_keys':
        results.expiredKeys = idempotencyService.cleanExpiredKeys();
        break;
      case 'cleanup_old_audit':
        results.auditRecords = auditService.cleanOldLogs(90);
        break;
      case 'cleanup_old_dead_letters':
        results.deadLetters = deadLetterService.cleanOldDeadLetters(7);
        break;
      case 'backup_database':
        await backupService.createBackup();
        results.backup = 'completed';
        break;
      default:
        reply.code(400).send({ error: 'Invalid maintenance action' });
        return;
    }
  } catch (error) {
    results.error = (error as Error).message;
  }

  auditService.logAction({
    tenantId: 'system',
    action: 'maintenance',
    resource: 'system',
    newValues: { action, results }
  });

  return { success: true, action, results };
});

// Middleware for audit logging and metrics
fastify.addHook('onRequest', async (request, reply) => {
  metricsService.increment('requests_total');
  
  if (request.url === '/health' || request.url.startsWith('/admin/metrics')) {
    return;
  }
  
  const tenantId = request.headers['x-tenant-id'] as string;
  if (tenantId) {
    auditService.logAction({
      tenantId,
      action: 'api_request',
      resource: request.method + ' ' + request.url,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] as string,
      newValues: SecurityUtils.sanitizeLogData({
        method: request.method,
        url: request.url
      })
    });
  }
});

// Enhanced error handler
fastify.setErrorHandler(async (error, request, reply) => {
  metricsService.increment('errors_total');
  
  const tenantId = request.headers['x-tenant-id'] as string;
  
  if (tenantId) {
    auditService.logAction({
      tenantId,
      action: 'api_error',
      resource: request.method + ' ' + request.url,
      newValues: {
        error: error.message,
        statusCode: error.statusCode || 500
      }
    });

    if (!error.statusCode || error.statusCode >= 500) {
      deadLetterService.store({
        tenantId,
        type: 'email',
        payload: {
          error: error.message,
          request: {
            method: request.method,
            url: request.url
          }
        },
        error: error.message,
        attempts: 1
      });
    }
  }
  
  reply.status(error.statusCode || 500).send({
    error: error.message,
    statusCode: error.statusCode || 500
  });
});

// Dashboard Analytics API Endpoints

// Get comprehensive dashboard metrics
fastify.get('/dashboard/metrics/:tenantId', async (request, reply) => {
  const adminKey = request.headers['x-admin-key'] as string;
  if (adminKey !== ADMIN_KEY) {
    reply.code(401).send({ error: 'Admin key required' });
    return;
  }

  try {
    const { tenantId } = request.params as { tenantId: string };
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };
    
    const dateRange = startDate && endDate ? { startDate, endDate } : undefined;
    const metrics = await dashboardService.getDashboardMetrics(tenantId, dateRange);
    
    auditService.logAction({
      tenantId,
      action: 'dashboard_viewed',
      resource: 'dashboard_metrics',
      newValues: { dateRange }
    });
    
    return metrics;
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Get live metrics for real-time dashboard updates
fastify.get('/dashboard/live/:tenantId', async (request, reply) => {
  const adminKey = request.headers['x-admin-key'] as string;
  if (adminKey !== ADMIN_KEY) {
    reply.code(401).send({ error: 'Admin key required' });
    return;
  }

  try {
    const { tenantId } = request.params as { tenantId: string };
    const liveMetrics = await dashboardService.getLiveMetrics(tenantId);
    
    return liveMetrics;
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ error: 'Failed to fetch live metrics' });
  }
});

// Export dashboard data
fastify.get('/dashboard/export/:tenantId', async (request, reply) => {
  const adminKey = request.headers['x-admin-key'] as string;
  if (adminKey !== ADMIN_KEY) {
    reply.code(401).send({ error: 'Admin key required' });
    return;
  }

  try {
    const { tenantId } = request.params as { tenantId: string };
    const { format, startDate, endDate } = request.query as { 
      format?: 'json' | 'csv'; 
      startDate?: string; 
      endDate?: string; 
    };
    
    const dateRange = startDate && endDate ? { startDate, endDate } : undefined;
    const exportData = await dashboardService.exportDashboardData(
      tenantId, 
      format || 'json', 
      dateRange
    );
    
    auditService.logAction({
      tenantId,
      action: 'dashboard_exported',
      resource: 'dashboard_export',
      newValues: { format: format || 'json', dateRange }
    });
    
    if (format === 'csv') {
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="dashboard-${tenantId}-${new Date().toISOString().split('T')[0]}.csv"`);
      return exportData;
    }
    
    return exportData;
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ error: 'Failed to export dashboard data' });
  }
});

// Tenant-specific dashboard endpoints (require tenant ID header)

// Get tenant dashboard overview (simplified metrics for tenant users)
fastify.get('/dashboard/overview', async (request, reply) => {
  try {
    const tenantId = (request as any).tenantId;
    
    // Get basic metrics without full admin access
    const metrics = await dashboardService.getDashboardMetrics(tenantId);
    
    // Return simplified view for tenant users
    const overview = {
      leads: {
        total: metrics.totalLeads,
        today: metrics.leadsToday,
        thisWeek: metrics.leadsThisWeek,
        thisMonth: metrics.leadsThisMonth,
        byStatus: metrics.leadsByStatus
      },
      quotes: {
        total: metrics.totalQuotes,
        today: metrics.quotesToday,
        averageValue: metrics.averageQuoteValue,
        conversionRate: metrics.quoteConversionRate
      },
      yachts: {
        total: metrics.totalYachts,
        byArea: metrics.yachtsByArea,
        popular: metrics.popularYachts.slice(0, 5) // Top 5 only
      },
      performance: {
        responseTime: metrics.averageResponseTime,
        uptime: metrics.systemUptime
      }
    };
    
    auditService.logAction({
      tenantId,
      action: 'dashboard_overview_viewed',
      resource: 'tenant_dashboard'
    });
    
    metricsService.increment('requests_total');
    
    return overview;
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ error: 'Failed to fetch dashboard overview' });
  }
});

// Get analytics charts data
fastify.get('/dashboard/charts', async (request, reply) => {
  try {
    const tenantId = (request as any).tenantId;
    const { type, days } = request.query as { type?: string; days?: string };
    
    const daysBack = parseInt(days || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const dateRange = {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString()
    };
    
    const metrics = await dashboardService.getDashboardMetrics(tenantId, dateRange);
    
    let chartData = {};
    
    switch (type) {
      case 'leads':
        chartData = {
          leadsByDay: metrics.leadsByDay,
          leadsByLocation: metrics.leadsByLocation,
          leadsByStatus: metrics.leadsByStatus
        };
        break;
      case 'quotes':
        chartData = {
          quotesByDay: metrics.quotesByDay,
          conversionTrend: metrics.conversionTrend
        };
        break;
      case 'revenue':
        chartData = {
          revenueByArea: metrics.revenueByArea,
          revenueByLocation: metrics.revenueByLocation,
          topPerformingYachts: metrics.topPerformingYachts.slice(0, 10)
        };
        break;
      case 'customers':
        chartData = {
          partySizeDistribution: metrics.partySizeDistribution,
          averagePartySize: metrics.averagePartySize,
          repeatCustomers: metrics.repeatCustomers
        };
        break;
      default:
        chartData = {
          leadsByDay: metrics.leadsByDay.slice(-14), // Last 2 weeks
          quotesByDay: metrics.quotesByDay.slice(-14),
          conversionTrend: metrics.conversionTrend.slice(-14)
        };
    }
    
    return {
      type: type || 'summary',
      dateRange,
      data: chartData
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ error: 'Failed to fetch chart data' });
  }
});

// Start server with headless banner
async function start() {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    
    console.log('================================================================================');
    console.log('🛥️  YACHT AUTOMATE - BRAIN API STARTED (HEADLESS MODE)');
    console.log('================================================================================');
    console.log(`Server listening on http://${HOST}:${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Admin Key:', ADMIN_KEY);
    console.log('Headless mode: UI disabled, JSON API only.');
    console.log('================================================================================');
    console.log('📖 HEADLESS RUNBOOK - API USAGE EXAMPLES');
    console.log('================================================================================');
    console.log('1. Health Check:');
    console.log(`curl -X GET "http://localhost:${PORT}/health"`);
    console.log('');
    console.log('2. Create Tenant (Admin):');
    console.log(`curl -X POST "http://localhost:${PORT}/admin/tenant" \\`);
    console.log(`  -H "X-Admin-Key: ${ADMIN_KEY}" \\`);
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{');
    console.log('    "id": "demo-charter",');
    console.log('    "name": "Demo Charter Company",');
    console.log('    "fromName": "Demo Charters",');
    console.log('    "fromEmail": "charters@demo.com"');
    console.log('  }\'');
    console.log('');
    console.log('3. Seed Yachts (Admin):');
    console.log(`curl -X POST "http://localhost:${PORT}/admin/yachts/seed" \\`);
    console.log(`  -H "X-Admin-Key: ${ADMIN_KEY}" \\`);
    console.log('  -H "X-Tenant-Id: demo-charter"');
    console.log('');
    console.log('4. Form-to-Lead (Integration):');
    console.log(`curl -X POST "http://localhost:${PORT}/integrations/form-to-lead" \\`);
    console.log('  -H "X-Tenant-Id: demo-charter" \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{');
    console.log('    "customerEmail": "client@example.com",');
    console.log('    "fullName": "John Smith",');
    console.log('    "numberOfGuests": 8,');
    console.log('    "destination": "Mediterranean",');
    console.log('    "message": "Looking for luxury yacht charter"');
    console.log('  }\' # Returns {leadId, status:"ok"}');
    console.log('');
    console.log('5. Search Yachts:');
    console.log(`curl -X GET "http://localhost:${PORT}/yachts?area=Mediterranean&guests=8&limit=5" \\`);
    console.log('  -H "X-Tenant-Id: demo-charter"');
    console.log('');
    console.log('6. Calculate Quote:');
    console.log(`curl -X POST "http://localhost:${PORT}/quote/calc" \\`);
    console.log('  -H "X-Tenant-Id: demo-charter" \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{');
    console.log('    "yachtId": "YACHT_ID_FROM_SEARCH",');
    console.log('    "weeks": 1,');
    console.log('    "extras": 5000');
    console.log('  }\' # Returns {breakdown,total}');
    console.log('');
    console.log('7. Webhook Dispatch:');
    console.log(`curl -X POST "http://localhost:${PORT}/integrations/webhook" \\`);
    console.log('  -H "X-Tenant-Id: demo-charter" \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{');
    console.log('    "event": "lead.created",');
    console.log('    "payload": {"leadId": "lead_123", "email": "test@example.com"}');
    console.log('  }\'');
    console.log('');
    console.log('8. Email Ingestion:');
    console.log(`curl -X POST "http://localhost:${PORT}/ingest/email" \\`);
    console.log('  -H "X-Tenant-Id: demo-charter" \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{');
    console.log('    "from": "inquiry@example.com",');
    console.log('    "subject": "Charter inquiry for 6 guests",');
    console.log('    "body": "Hi, we are looking to charter a yacht in the Bahamas for 6 people."');
    console.log('  }\'');
    console.log('================================================================================');
    console.log('🚀 Ready to process yacht charter leads!');
    console.log('📧 Email automation: SMTP not configured - emails will log to console');
    console.log('💾 Database: SQLite at db/data.sqlite');
    console.log('🔐 Multi-tenant: Use X-Tenant-Id header for all non-admin requests');
    console.log('🎯 Integration ready: Form-to-lead & webhook endpoints active');
    console.log('================================================================================');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();