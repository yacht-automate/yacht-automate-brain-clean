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

// Initialize email service with logger
const emailService = new EmailService(db, fastify.log);
const seedService = new SeedService(db);
const backupService = new BackupService(db);

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
  const adminPaths = ['/admin/tenant', '/admin/yachts/seed', '/admin/status', '/admin/backup', '/admin/export', '/admin/yachts/upload'];
  
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

// Routes - Headless mode: Return 400 for root access
fastify.get('/', async (request, reply) => {
  reply.code(400).send({ error: 'API only' });
});

fastify.get('/health', async () => monitoring.getHealthStatus());

// Demo webpage endpoint
fastify.get('/demo', async (request, reply) => {
  reply.type('text/html');
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yacht Charter Automation Demo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c5aa0;
            text-align: center;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }
        input, select, textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
        }
        textarea {
            height: 100px;
            resize: vertical;
        }
        button {
            background: #2c5aa0;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            font-size: 18px;
            cursor: pointer;
            width: 100%;
            margin-top: 20px;
        }
        button:hover {
            background: #1a4080;
        }
        .demo-info {
            background: #e8f4f8;
            padding: 20px;
            border-left: 4px solid #2c5aa0;
            margin-bottom: 30px;
            border-radius: 5px;
        }
        .results {
            margin-top: 30px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 5px;
            display: none;
        }
        .yacht-card {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border: 1px solid #ddd;
        }
        .yacht-name {
            font-size: 18px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 10px;
        }
        .yacht-details {
            color: #666;
            margin-bottom: 10px;
        }
        .yacht-price {
            font-size: 16px;
            font-weight: bold;
            color: #2c5aa0;
        }
        .loading {
            text-align: center;
            color: #666;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛥️ Yacht Charter Automation Demo</h1>
        
        <div class="demo-info">
            <h3>Live Customer Demo</h3>
            <p>This form demonstrates how your customers would submit yacht charter inquiries. The system processes requests in real-time and matches yachts from your inventory in under 1 second.</p>
            <p><strong>What happens:</strong> Form submission → Yacht matching → Professional email response</p>
        </div>

        <form id="charter-form">
            <div class="form-group">
                <label for="name">Your Name *</label>
                <input type="text" id="name" name="name" required value="Sarah Johnson">
            </div>

            <div class="form-group">
                <label for="email">Email Address *</label>
                <input type="email" id="email" name="email" required value="sarah.johnson@demo.com">
            </div>

            <div class="form-group">
                <label for="guests">Number of Guests *</label>
                <input type="number" id="guests" name="guests" min="1" max="20" required value="8">
            </div>

            <div class="form-group">
                <label for="location">Charter Location *</label>
                <select id="location" name="location" required>
                    <option value="">Select a location</option>
                    <option value="Mediterranean" selected>Mediterranean</option>
                    <option value="Caribbean">Caribbean</option>
                    <option value="Bahamas">Bahamas</option>
                </select>
            </div>

            <div class="form-group">
                <label for="budget">Weekly Budget (EUR/USD) *</label>
                <input type="number" id="budget" name="budget" min="10000" value="120000">
            </div>

            <div class="form-group">
                <label for="dates">Preferred Dates</label>
                <input type="text" id="dates" name="dates" value="July 2024, flexible">
            </div>

            <div class="form-group">
                <label for="notes">Tell us about your ideal charter</label>
                <textarea id="notes" name="notes">Looking for luxury motor yacht with water sports equipment, spacious deck areas, and modern amenities for family vacation.</textarea>
            </div>

            <button type="submit">Find Perfect Yachts</button>
        </form>

        <div id="results" class="results">
            <h3>🎯 Yacht Matching Results</h3>
            <div id="results-content"></div>
        </div>
    </div>

    <script>
        document.getElementById('charter-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {
                email: formData.get('email'),
                name: formData.get('name'),
                notes: \`Looking for \${formData.get('location')} yacht charter for \${formData.get('guests')} guests. Budget: \${formData.get('budget')}. Dates: \${formData.get('dates')}. \${formData.get('notes')}\`,
                partySize: parseInt(formData.get('guests')),
                location: formData.get('location'),
                budget: parseInt(formData.get('budget')) || null,
                dates: formData.get('dates')
            };

            const resultsDiv = document.getElementById('results');
            const resultsContent = document.getElementById('results-content');
            
            resultsDiv.style.display = 'block';
            resultsContent.innerHTML = '<div class="loading">🔄 Processing your yacht charter request...</div>';

            try {
                const response = await fetch('/lead', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Tenant-Id': 'demo-live'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    let html = \`
                        <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                            <strong>✅ Success!</strong> Found \${result.matchCount} yacht matches in under 1 second<br>
                            <strong>Lead ID:</strong> \${result.lead.id}
                        </div>
                    \`;

                    if (result.candidates && result.candidates.length > 0) {
                        html += '<h4>🛥️ Recommended Yachts:</h4>';
                        result.candidates.slice(0, 5).forEach(yacht => {
                            html += \`
                                <div class="yacht-card">
                                    <div class="yacht-name">\${yacht.name}</div>
                                    <div class="yacht-details">
                                        <strong>Builder:</strong> \${yacht.builder} | 
                                        <strong>Length:</strong> \${yacht.length}m | 
                                        <strong>Guests:</strong> \${yacht.guests} | 
                                        <strong>Type:</strong> \${yacht.type}
                                    </div>
                                    <div class="yacht-price">Weekly Charter: \${yacht.currency} \${yacht.weeklyRate.toLocaleString()}</div>
                                </div>
                            \`;
                        });
                        
                        html += \`
                            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px;">
                                <strong>📧 What happens next:</strong><br>
                                • Professional email sent to customer with yacht details and quotes<br>
                                • APA and VAT calculations included automatically<br>
                                • Charter specialist contact information provided<br>
                                • Lead logged in system for follow-up
                            </div>
                        \`;
                    }

                    resultsContent.innerHTML = html;
                } else {
                    resultsContent.innerHTML = \`
                        <div style="background: #f8d7da; padding: 15px; border-radius: 5px; color: #721c24;">
                            <strong>Error:</strong> \${result.error || 'Unable to process request'}
                        </div>
                    \`;
                }
            } catch (error) {
                resultsContent.innerHTML = \`
                    <div style="background: #f8d7da; padding: 15px; border-radius: 5px; color: #721c24;">
                        <strong>Connection Error:</strong> Unable to reach automation system.<br>
                        <small>This demonstrates the real-time integration with your yacht inventory.</small>
                    </div>
                \`;
            }
        });
    </script>
</body>
</html>`;
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
    
    // Calculate quotes for top candidates and queue email
    if (candidates.length > 0) {
      const area = data.location || candidates[0].area;
      
      // Generate quotes for top 4 yachts
      const candidatesWithQuotes = candidates.slice(0, 4).map(yacht => {
        const quote = quoteCalc.calculateQuote(yacht, 1, 0);
        
        // Save quote to database
        const savedQuote = db.createQuote({
          tenantId,
          yachtId: yacht.id!,
          basePrice: quote.basePrice,
          apa: quote.apa,
          vat: quote.vat,
          extras: quote.extras,
          total: quote.total,
          currency: quote.currency
        });
        
        return { yacht, quote, quoteId: savedQuote.id };
      });

      const emailJob = emailService.createLeadReplyEmail(
        data.email,
        data.name,
        area,
        data.partySize,
        candidatesWithQuotes.map(c => c.yacht)
      );
      
      emailJob.tenantId = tenantId;
      emailJob.leadId = lead.id.toString();
      
      // Add tenant info for CC email
      const tenant = db.getTenant(tenantId);
      if (tenant && tenant.fromEmail) {
        emailJob.cc = tenant.fromEmail; // CC the charter company
      }
      
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

// Admin endpoints for production management
fastify.get('/admin/status', async (request, reply) => {
  return {
    health: monitoring.getHealthStatus(),
    backup: backupService.getBackupStatus(),
    environment: process.env.NODE_ENV || 'development'
  };
});

fastify.post('/admin/backup', async (request, reply) => {
  const backupPath = backupService.createBackup();
  return {
    success: !!backupPath,
    backupPath,
    message: backupPath ? 'Backup created successfully' : 'Backup failed'
  };
});

fastify.get('/admin/export', async (request, reply) => {
  const data = backupService.exportData();
  return {
    success: !!data,
    data: data || {},
    exportedAt: new Date().toISOString()
  };
});

// Client onboarding endpoint for CSV yacht upload
fastify.post('/admin/yachts/upload', async (request, reply) => {
  try {
    const tenantId = request.headers['x-tenant-id'] as string;
    const { yachtData } = request.body as { yachtData: any[] };
    
    if (!tenantId) {
      reply.code(400).send({ error: 'X-Tenant-Id header required' });
      return;
    }

    const count = seedService.seedYachtsFromData(tenantId, yachtData);
    
    return {
      success: true,
      message: `Successfully uploaded ${count} yachts`,
      count
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(400).send({ error: 'Invalid yacht data format' });
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
