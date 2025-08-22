# Railway Deployment from GitHub - Complete Guide

## Step 1: Update Your GitHub Repository (Manual)

You need to push your tier-enabled code to GitHub first. In your Replit terminal, run:

```bash
git add .
git commit -m "Add tier-based pricing support (starter/pro/enterprise)"
git push origin main
```

## Step 2: Railway Account Setup

1. **Go to [railway.app](https://railway.app)**
2. **Sign up with GitHub account**
3. **Upgrade to Pro Plan** ($5/month + usage)
   - Click profile → Billing → Pro Plan
   - Add payment method

## Step 3: Deploy from GitHub Repository

1. **In Railway Dashboard:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `yacht-automate-brain-production` repository
   - Click "Deploy Now"

2. **Railway automatically:**
   - Detects Node.js project
   - Runs `npm install`
   - Starts with `npx ts-node src/index.ts`
   - Assigns URL like `yourapp.railway.app`

## Step 4: Environment Configuration

**In Railway project → Variables tab, add:**

```
NODE_ENV=production
ADMIN_KEY=yacht-automation-secure-2025-CHANGE-THIS
PORT=5000
ALLOWED_DOMAIN=*
FROM_EMAIL=yacht-system@yourdomain.com
FROM_NAME=Yacht Charter Automation
```

**For email automation:**
```
SMTP_HOST=smtp.yourdomain.com
SMTP_USER=yacht-system@yourdomain.com
SMTP_PASS=your-smtp-password
```

## Step 5: Custom Domain Setup

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

## Step 6: Test Your Deployed System

```bash
# Health check
curl https://api.yachtautomation.com/health

# Create starter tier customer
curl -X POST "https://api.yachtautomation.com/admin/tenant" \
  -H "X-Admin-Key: yacht-automation-secure-2025-CHANGE-THIS" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "starter-customer",
    "name": "Starter Customer",
    "tier": "starter",
    "fromEmail": "demo@yachtcompany.com"
  }'

# Create pro tier customer
curl -X POST "https://api.yachtautomation.com/admin/tenant" \
  -H "X-Admin-Key: yacht-automation-secure-2025-CHANGE-THIS" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "pro-customer",
    "name": "Pro Customer", 
    "tier": "pro",
    "fromEmail": "reservations@procharters.com"
  }'

# Seed demo yachts
curl -X POST "https://api.yachtautomation.com/admin/yachts/seed" \
  -H "X-Admin-Key: yacht-automation-secure-2025-CHANGE-THIS" \
  -H "X-Tenant-Id: pro-customer"

# Test tier restrictions
curl -X GET "https://api.yachtautomation.com/dashboard/analytics" \
  -H "X-Tenant-Id: starter-customer"
# Should return: "Feature requires Pro or Enterprise tier"

curl -X GET "https://api.yachtautomation.com/dashboard/analytics" \
  -H "X-Tenant-Id: pro-customer"  
# Should return: Full analytics data
```

## Step 7: Test Complete Automation Flow

```bash
# Test website form integration
curl -X POST "https://api.yachtautomation.com/integrations/form-to-lead" \
  -H "X-Tenant-Id: pro-customer" \
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

## Your System Features (All Included)

### Tier-Based Pricing:
- **Starter:** $99/month (basic automation)
- **Pro:** $299/month (analytics + branding)
- **Enterprise:** $599/month (all features + priority support)

### Complete Automation:
- Website form integration
- Email inquiry processing
- Instant yacht matching
- Professional quote generation
- Automated forwarding to customer email
- Real-time analytics dashboard (Pro/Enterprise)

### Production Features:
- Multi-tenant architecture
- Security hardening and audit logging
- Email queue with retry logic
- Daily automated backups
- Performance monitoring
- Custom branding support

## Revenue Model

**Per Customer Hosting Cost:** ~$15-20/month on Railway
**Customer Monthly Revenue:**
- Starter: $99/month = **$79-84 profit**
- Pro: $299/month = **$279-284 profit**  
- Enterprise: $599/month = **$579-584 profit**

**Target:** 20 mixed customers = $60,000-144,000/year revenue

## Next Steps After Deployment

1. **Test all three tiers** with demo customers
2. **Configure SMTP** for email automation
3. **Set up monitoring** and alerts
4. **Create sales materials** for yacht companies
5. **Start customer acquisition** with live system

Your complete yacht automation system will be live on Railway with professional infrastructure, ready to process leads for yacht companies at three pricing tiers.

## Production Checklist

- [ ] GitHub repository updated with tier code
- [ ] Railway deployment successful
- [ ] Custom domain configured with SSL
- [ ] Environment variables set
- [ ] SMTP email configured
- [ ] All three tiers tested
- [ ] Demo customers created
- [ ] Form integration verified
- [ ] Analytics dashboard accessible
- [ ] Ready for customer onboarding

Your yacht automation business is ready to launch commercially.