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

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '5000');
const HOST = '0.0.0.0';
const ADMIN_KEY = process.env.ADMIN_KEY || 'changeme-admin';

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

// Initialize email service with logger
const emailService = new EmailService(db, fastify.log);
const seedService = new SeedService(db);

// Register plugins in async function
fastify.register(cors);
fastify.register(rateLimit, {
  max: 60,
  timeWindow: '1 minute'
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
  const excludedPaths = ['/health', '/'];
  const adminPaths = ['/admin/tenant', '/admin/yachts/seed'];
  
  if (excludedPaths.includes(request.url)) {
    return;
  }

  if (adminPaths.some(path => request.url.startsWith(path))) {
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

// Routes
fastify.get('/', async () => {
  return { 
    service: 'Yacht Automate - Brain API',
    status: 'operational',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      search: 'GET /yachts (requires X-Tenant-Id)',
      lead: 'POST /lead (requires X-Tenant-Id)',
      quote: 'POST /quote/calc (requires X-Tenant-Id)',
      admin: 'POST /admin/* (requires X-Admin-Key)'
    },
    docs: 'See console logs for curl examples'
  };
});

fastify.get('/health', async () => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

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

fastify.get('/yachts', async (request) => {
  const tenantId = (request as any).tenantId;
  const filters = SearchYachtsRequestSchema.parse(request.query);
  
  const yachts = db.searchYachts(tenantId, filters);
  
  db.logEvent({
    tenantId,
    type: 'yacht_search',
    payload: JSON.stringify({ filters, resultCount: yachts.length })
  });

  return { yachts, count: yachts.length };
});

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

    // Queue email if we have matches
    if (candidates.length > 0) {
      const area = data.location || candidates[0].area;
      const emailJob = emailService.createLeadReplyEmail(
        data.email,
        data.name,
        area,
        data.partySize,
        candidates.slice(0, 4)
      );
      
      emailJob.tenantId = tenantId;
      emailJob.leadId = lead.id;
      
      emailQueue.push({ job: emailJob, retries: 0 });
    }

    db.logEvent({
      tenantId,
      type: 'lead_created',
      entityId: lead.id,
      payload: JSON.stringify({
        leadId: lead.id,
        email: data.email,
        partySize: data.partySize,
        matchCount: candidates.length
      })
    });

    return {
      success: true,
      lead,
      candidates,
      matchCount: candidates.length
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(400).send({ error: 'Invalid request data' });
  }
});

fastify.post('/quote/calc', async (request, reply) => {
  try {
    const tenantId = (request as any).tenantId;
    const data = CalculateQuoteRequestSchema.parse(request.body);
    
    const yacht = db.getYacht(data.yachtId);
    if (!yacht || yacht.tenantId !== tenantId) {
      reply.code(404).send({ error: 'Yacht not found' });
      return;
    }

    const breakdown = quoteCalc.calculateQuote(yacht, data.weeks, data.extras);
    
    // Save quote
    const quote = db.createQuote({
      tenantId,
      yachtId: data.yachtId,
      basePrice: breakdown.basePrice,
      apa: breakdown.apa,
      vat: breakdown.vat,
      extras: breakdown.extras,
      total: breakdown.total,
      currency: breakdown.currency
    });

    db.logEvent({
      tenantId,
      type: 'quote_calculated',
      entityId: quote.id,
      payload: JSON.stringify({
        yachtId: data.yachtId,
        weeks: data.weeks,
        total: breakdown.total
      })
    });

    return {
      success: true,
      quote: breakdown,
      formatted: quoteCalc.formatQuoteBreakdown(breakdown)
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(400).send({ error: 'Invalid request data' });
  }
});

fastify.post('/ingest/email', async (request, reply) => {
  try {
    const tenantId = (request as any).tenantId;
    const data = IngestEmailRequestSchema.parse(request.body);
    
    // Simple email parsing - extract party size and location hints
    const body = data.body.toLowerCase();
    const subject = data.subject.toLowerCase();
    const combined = `${subject} ${body}`;
    
    // Extract party size
    let partySize = 4; // default
    const guestMatches = combined.match(/(\d+)\s*(?:guests?|people|persons?|pax)/);
    if (guestMatches) {
      partySize = parseInt(guestMatches[1]);
    }

    // Extract location hints
    let location = '';
    if (combined.includes('mediterranean') || combined.includes('med')) location = 'Mediterranean';
    else if (combined.includes('caribbean')) location = 'Caribbean';
    else if (combined.includes('bahamas')) location = 'Bahamas';

    // Create lead from email
    const lead = db.createLead({
      tenantId,
      email: data.from,
      notes: `${data.subject}\n\n${data.body}`,
      partySize,
      location: location || undefined,
      status: 'parsed'
    });

    db.logEvent({
      tenantId,
      type: 'email_ingested',
      entityId: lead.id,
      payload: JSON.stringify({
        from: data.from,
        subject: data.subject,
        parsedPartySize: partySize,
        parsedLocation: location
      })
    });

    return {
      success: true,
      lead,
      parsed: {
        partySize,
        location: location || null
      }
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(400).send({ error: 'Invalid request data' });
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    
    console.log('\n' + '='.repeat(80));
    console.log('🛥️  YACHT AUTOMATE - BRAIN API STARTED');
    console.log('='.repeat(80));
    console.log(`Server listening on http://${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Admin Key: ${ADMIN_KEY}`);
    console.log('='.repeat(80));
    
    // Print runbook
    printRunbook();
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

function printRunbook() {
  const baseUrl = `http://localhost:${PORT}`;
  
  console.log('\n📖 RUNBOOK - API USAGE EXAMPLES');
  console.log('='.repeat(80));
  
  console.log('\n1. Health Check:');
  console.log(`curl -X GET "${baseUrl}/health"`);
  
  console.log('\n2. Create Tenant (Admin):');
  console.log(`curl -X POST "${baseUrl}/admin/tenant" \\
  -H "X-Admin-Key: ${ADMIN_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "demo-charter",
    "name": "Demo Charter Company",
    "fromName": "Demo Charters",
    "fromEmail": "charters@demo.com"
  }'`);
  
  console.log('\n3. Seed Yachts (Admin):');
  console.log(`curl -X POST "${baseUrl}/admin/yachts/seed" \\
  -H "X-Admin-Key: ${ADMIN_KEY}" \\
  -H "X-Tenant-Id: demo-charter"`);
  
  console.log('\n4. Search Yachts:');
  console.log(`curl -X GET "${baseUrl}/yachts?area=Mediterranean&guests=8&limit=5" \\
  -H "X-Tenant-Id: demo-charter"`);
  
  console.log('\n5. Search Yachts (Bahamas):');
  console.log(`curl -X GET "${baseUrl}/yachts?area=Bahamas&guests=6" \\
  -H "X-Tenant-Id: demo-charter"`);
  
  console.log('\n6. Submit Lead:');
  console.log(`curl -X POST "${baseUrl}/lead" \\
  -H "X-Tenant-Id: demo-charter" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "client@example.com",
    "name": "John Smith",
    "notes": "Looking for a luxury motor yacht in the Mediterranean for summer charter",
    "partySize": 8,
    "location": "Mediterranean",
    "dates": "July 2024",
    "budget": 150000
  }'`);
  
  console.log('\n7. Calculate Quote:');
  console.log(`# First get a yacht ID from search, then:
curl -X POST "${baseUrl}/quote/calc" \\
  -H "X-Tenant-Id: demo-charter" \\
  -H "Content-Type: application/json" \\
  -d '{
    "yachtId": "YACHT_ID_FROM_SEARCH",
    "weeks": 1,
    "extras": 5000
  }'`);
  
  console.log('\n8. Ingest Email:');
  console.log(`curl -X POST "${baseUrl}/ingest/email" \\
  -H "X-Tenant-Id: demo-charter" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "inquiry@example.com",
    "subject": "Charter inquiry for 6 guests",
    "body": "Hi, we are looking to charter a yacht in the Bahamas for 6 people next month. Budget around $50k per week."
  }'`);
  
  console.log('\n' + '='.repeat(80));
  console.log('🚀 Ready to process yacht charter leads!');
  console.log('📧 Email automation: SMTP not configured - emails will log to console');
  console.log('💾 Database: SQLite at db/data.sqlite');
  console.log('🔐 Multi-tenant: Use X-Tenant-Id header for all non-admin requests');
  console.log('='.repeat(80) + '\n');
}

start();
