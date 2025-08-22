# 🚂 RAILWAY DEPLOYMENT - STEP BY STEP

## Why Railway for Production

Your yacht automation system needs professional hosting for customer deployments. Railway provides:

- **Custom domains**: yacht-automation.railway.app or your own domain
- **99.9% uptime**: Production-grade infrastructure vs Replit's development focus  
- **Persistent storage**: SQLite database guaranteed to survive restarts
- **Auto-scaling**: Handles traffic spikes automatically
- **SSL certificates**: Professional HTTPS for customer integrations
- **No sleep mode**: Always available for customer API calls

## Pre-Deployment Checklist

**✅ System Status:**
- Headless mode: Complete ✓
- API endpoints: All working ✓  
- Multi-tenant: Operational ✓
- Demo data: 40 yachts ready ✓
- Integration endpoints: Form-to-lead & webhook active ✓

## Railway Deployment Process

### Step 1: GitHub Repository Setup

**Upload your latest package to GitHub:**
```bash
# If you haven't already:
1. Extract yacht-automate-brain-headless-v1.1.tar.gz
2. Upload all files to your GitHub repository
3. Ensure package.json has the correct start command
```

**Verify package.json scripts:**
```json
{
  "scripts": {
    "start": "npx ts-node src/index.ts",
    "dev": "npx ts-node src/index.ts"
  }
}
```

### Step 2: Railway Account & Project

**Create Railway account:**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended)
3. Connect your GitHub account

**Import project:**
1. Click "New Project" 
2. Select "Deploy from GitHub repo"
3. Choose your yacht-automate-brain repository
4. Railway auto-detects Node.js and configures build

### Step 3: Environment Variables

**Configure in Railway dashboard > Variables:**

**Required for production:**
```
NODE_ENV=production
ADMIN_KEY=yacht-brain-prod-2025-secure-key
PORT=5000
```

**Optional SMTP (for email automation):**
```
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_NAME=Yacht Automation
FROM_EMAIL=system@your-domain.com
```

**Security (recommended):**
```
ALLOWED_ORIGINS=https://client1.com,https://client2.com
```

### Step 4: Deploy & Verify

**Railway automatically:**
- Builds your Node.js application
- Installs all dependencies from package.json
- Starts the server on assigned port
- Provides HTTPS URL (e.g., yacht-automation-production.up.railway.app)

**Test deployment:**
```bash
# Replace with your Railway URL
curl -X GET "https://your-app.up.railway.app/health"

# Should return:
# {"status":"healthy","uptime":123,"errorCount":0}
```

### Step 5: Production Testing

**Create demo tenant:**
```bash
curl -X POST "https://your-app.up.railway.app/admin/tenant" \
  -H "X-Admin-Key: yacht-brain-prod-2025-secure-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "demo-charter",
    "name": "Demo Charter Company"
  }'
```

**Seed yacht inventory:**
```bash
curl -X POST "https://your-app.up.railway.app/admin/yachts/seed" \
  -H "X-Admin-Key: yacht-brain-prod-2025-secure-key" \
  -H "X-Tenant-Id: demo-charter"
```

**Test form integration:**
```bash
curl -X POST "https://your-app.up.railway.app/integrations/form-to-lead" \
  -H "X-Tenant-Id: demo-charter" \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "test@example.com",
    "fullName": "John Smith",
    "numberOfGuests": 8,
    "destination": "Mediterranean"
  }'
```

## Post-Deployment Configuration

### Custom Domain (Optional)

**Add your domain:**
1. Railway dashboard > Settings > Domains
2. Add custom domain (e.g., api.yacht-automation.com)
3. Configure DNS CNAME record
4. SSL certificate auto-generated

### Monitoring Setup

**Railway provides built-in:**
- Application logs and metrics
- Uptime monitoring  
- Performance analytics
- Error tracking

**Access via Railway dashboard > Observability**

### Customer Integration URLs

**Update your sales materials with production URLs:**

**API Base URL:**
```
https://yacht-automation.up.railway.app
```

**Health check:**
```
GET https://yacht-automation.up.railway.app/health
```

**Customer integration endpoint:**
```
POST https://yacht-automation.up.railway.app/integrations/form-to-lead
```

## Production Benefits for Customers

**Professional hosting means:**
- No downtime during sales presentations
- Customers can integrate with confidence
- Proper SSL for secure API calls
- Custom domains for white-label deployments
- Scalable infrastructure for high-volume charter companies

## Next Steps After Railway Deployment

1. **Update demo URLs** in all sales materials
2. **Test customer integration** flows end-to-end
3. **Configure SMTP** for email automation
4. **Set up monitoring** alerts for production issues
5. **Begin customer acquisition** with professional hosting

Your yacht automation system will be production-ready and professionally hosted, justifying the $4,997 setup + $997/month pricing for yacht charter companies.

## Railway vs Replit Summary

**Replit (Current):** Perfect for development and demos
**Railway (Production):** Professional hosting for paying customers

Both work together - develop on Replit, deploy to Railway for customers.