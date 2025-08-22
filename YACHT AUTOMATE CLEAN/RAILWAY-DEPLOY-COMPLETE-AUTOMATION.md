# Railway Deployment - Complete Yacht Automation System

## Step 1: Railway Account Setup (2 minutes)

1. **Go to [railway.app](https://railway.app)**
2. **Click "Start a New Project"**
3. **Sign up with GitHub account**
4. **Verify email address**
5. **Upgrade to Pro Plan** ($5/month + usage)
   - Click profile → Account Settings → Billing → Pro Plan
   - Add payment method

## Step 2: Deploy Your Repository (3 minutes)

1. **In Railway Dashboard:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your yacht-automate repository
   - Click "Deploy Now"

2. **Railway automatically:**
   - Detects Node.js project
   - Runs `npm install`
   - Starts with `npx ts-node src/index.ts`
   - Assigns URL like `yourapp.railway.app`

## Step 3: Environment Configuration (3 minutes)

**In Railway project → Variables tab, add:**

```
NODE_ENV=production
ADMIN_KEY=yacht-automation-secure-2025-CHANGE-THIS
PORT=5000
ALLOWED_DOMAIN=*
FROM_EMAIL=yacht-system@yourdomain.com
FROM_NAME=Yacht Charter Automation
```

**For email automation (essential for forwarding):**
```
SMTP_HOST=smtp.yourdomain.com
SMTP_USER=yacht-system@yourdomain.com
SMTP_PASS=your-smtp-password
```

## Step 4: Custom Domain Setup (5 minutes)

### In Railway:
1. **Settings → Domains → Custom Domain**
2. **Enter:** `api.yachtautomation.com`
3. **Copy CNAME target:** (e.g., `abc123.railway.app`)

### In Your Domain DNS:
1. **Add CNAME record:**
   - **Name:** `api`
   - **Value:** `abc123.railway.app`
   - **TTL:** 300 seconds
2. **Wait 10-15 minutes** for SSL certificate

## Step 5: Test Full System (2 minutes)

```bash
# Health check
curl https://api.yachtautomation.com/health

# Create demo tenant
curl -X POST "https://api.yachtautomation.com/admin/tenant" \
  -H "X-Admin-Key: yacht-automation-secure-2025-CHANGE-THIS" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "demo-customer",
    "name": "Demo Yacht Company",
    "fromEmail": "demo@yachtcompany.com"
  }'

# Seed demo yachts
curl -X POST "https://api.yachtautomation.com/admin/yachts/seed" \
  -H "X-Admin-Key: yacht-automation-secure-2025-CHANGE-THIS" \
  -H "X-Tenant-Id: demo-customer"
```

## Step 6: Test Complete Automation Flow (3 minutes)

```bash
# Test website form integration
curl -X POST "https://api.yachtautomation.com/integrations/form-to-lead" \
  -H "X-Tenant-Id: demo-customer" \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "test@client.com",
    "fullName": "John Smith",
    "numberOfGuests": 8,
    "destination": "Mediterranean",
    "message": "Looking for luxury yacht charter"
  }'
```

**This will:**
- Process inquiry instantly
- Find matching yachts
- Calculate quotes with APA/VAT
- Send professional response to client
- Forward complete results to yacht company email

## Step 7: Customer Integration Instructions

### Website Form Integration:
Customer's web developer changes their contact form action from:
```html
<!-- Before -->
<form action="mailto:reservations@yachtcompany.com">

<!-- After -->
<form action="https://api.yachtautomation.com/integrations/form-to-lead">
  <input type="hidden" name="tenantId" value="customer-specific-id">
```

### Email Forwarding Setup:
Configure customer's email server to forward inquiries to:
`https://api.yachtautomation.com/ingest/email`

## Step 8: Customer Onboarding Process

### For Each New Customer:

1. **Create their tenant:**
```bash
curl -X POST "https://api.yachtautomation.com/admin/tenant" \
  -H "X-Admin-Key: your-admin-key" \
  -d '{
    "id": "monaco-luxury-yachts",
    "name": "Monaco Luxury Yachts",
    "fromEmail": "reservations@monacoyachts.com"
  }'
```

2. **Import their yacht fleet:**
```bash
curl -X POST "https://api.yachtautomation.com/admin/yachts/upload" \
  -H "X-Admin-Key: your-admin-key" \
  -H "X-Tenant-Id: monaco-luxury-yachts" \
  -d '[{yacht data}]'
```

3. **Configure email forwarding** to their existing email
4. **Update their website form** to submit to your system
5. **Train their team** on the automation process

## Complete Automation Features

### Website Form Processing:
- Instant yacht matching
- Professional quote generation
- Immediate client response
- Complete forwarding to customer email

### Email Inquiry Processing:
- Parse natural language inquiries
- Extract guest count, destination, dates
- Generate yacht recommendations
- Send professional responses
- Forward everything to customer

### Dashboard Analytics:
- Real-time lead tracking
- Conversion rate monitoring
- Revenue analytics
- Popular yacht insights

### Professional Email Templates:
- Branded responses with customer's identity
- Professional yacht presentation
- Clear pricing breakdowns
- Next steps for booking

## Tiered SaaS Revenue Model

### Starter Tier: $99/month ($89/month annual)
**Target:** Small agencies (1-10 yachts)
- Basic inquiry processing and auto-quotes
- Email responses with yacht recommendations  
- Lead forwarding to existing workflow
- **Monthly profit:** ~$79-84/customer

### Pro Tier: $299/month ($269/month annual)  
**Target:** Mid-size brokers (10-50 yachts)
- All Starter features plus advanced analytics
- Custom branded proposals with photos
- CRM webhooks and business intelligence
- **Monthly profit:** ~$279-284/customer

### Enterprise Tier: $599/month ($539/month annual)
**Target:** Large charters (50+ yachts)
- All Pro features plus priority support
- Custom integrations and dedicated account manager
- Advanced multi-tenant isolation
- **Monthly profit:** ~$579-584/customer

**Setup Fee:** $997 one-time (waived for annual signups)
**Railway hosting cost:** ~$15-20/month per customer

**Revenue Projections:**
- 20 mixed-tier customers = $60,000-144,000/year
- Average $250/month per customer = $60,000/year from 20 customers
- Scales to multi-million revenue long-term

## System Monitoring

**Railway provides:**
- 99.9% uptime monitoring
- Automatic scaling
- SSL certificate management
- Backup and recovery

**Your system includes:**
- Health monitoring endpoints
- Error tracking and alerts
- Performance metrics
- Audit logging

## Production Ready Checklist

- [ ] Railway deployment successful
- [ ] Custom domain configured with SSL
- [ ] Environment variables set
- [ ] SMTP email configured
- [ ] Admin access secured
- [ ] Health checks passing
- [ ] Demo tenant and yachts created
- [ ] Form integration tested
- [ ] Email forwarding verified
- [ ] Analytics dashboard accessible

Your complete yacht automation system is now live on Railway, ready to process website forms and email inquiries with instant yacht matching, professional responses, and seamless forwarding to customer emails.

The system handles everything automatically while making yacht companies look more professional and responsive to their clients.