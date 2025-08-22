# Railway Deployment Guide - Complete Step-by-Step

## Overview

This guide walks you through deploying Yacht Automate Brain to Railway for production hosting with custom domains, SSL certificates, and 99.9% uptime.

## Prerequisites

- GitHub repository with your system (demo or production version)
- Railway account (free tier available, Pro recommended for production)
- Credit card for Railway Pro plan ($5/month minimum)

## Step 1: Railway Account Setup

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub (recommended for easy repo access)
4. Verify your email address

### 1.2 Upgrade to Pro Plan (Recommended)
1. Click your profile → "Account Settings"
2. Go to "Billing" tab
3. Select "Pro Plan" ($5/month + usage)
4. Add payment method
5. **Why Pro**: Custom domains, more resources, priority support

## Step 2: Project Deployment

### 2.1 Create New Project
1. **From Railway Dashboard**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your yacht-automate repository (demo or production)
   - Click "Deploy Now"

### 2.2 Automatic Detection
Railway will automatically:
- Detect Node.js project
- Install dependencies via `npm install`
- Start application with `npm start`
- Assign temporary domain (yourapp.railway.app)

### 2.3 Initial Deployment Status
- Wait 2-3 minutes for first deployment
- Check "Deployments" tab for build progress
- Green checkmark = successful deployment
- Red X = build failed (check logs)

## Step 3: Environment Configuration

### 3.1 Set Production Environment Variables
1. **Go to your Railway project**
2. **Click "Variables" tab**
3. **Add these variables**:

```
NODE_ENV=production
ADMIN_KEY=yacht-brain-prod-2025-secure-key-CHANGE-THIS
PORT=5000
ALLOWED_DOMAIN=*
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Yacht Charter System
```

### 3.2 SMTP Configuration (Optional)
If customer has email server:
```
SMTP_HOST=smtp.yourdomain.com
SMTP_USER=yacht-system@yourdomain.com
SMTP_PASS=your-smtp-password
```

### 3.3 Security Variables
```
ADMIN_KEY=generate-unique-secure-key-here
DATABASE_ENCRYPTION_KEY=another-unique-key-for-database
```

## Step 4: Custom Domain Setup

### 4.1 Add Custom Domain
1. **In Railway project, go to "Settings"**
2. **Click "Domains" section**
3. **Click "Custom Domain"**
4. **Enter your domain**: `api.yachtcompany.com`
5. **Copy the CNAME target** (something like `xyz123.railway.app`)

### 4.2 Configure DNS
1. **Go to your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Add CNAME record**:
   - **Name**: `api`
   - **Value**: `xyz123.railway.app` (from Railway)
   - **TTL**: 300 seconds
3. **Save DNS changes**

### 4.3 SSL Certificate
- Railway automatically provisions SSL certificates
- HTTPS will be available within 10-15 minutes after DNS propagation
- Certificate auto-renews

## Step 5: Database Configuration

### 5.1 SQLite File Persistence
1. **In Railway, go to "Settings"**
2. **Click "Volumes"**
3. **Add volume**:
   - **Mount Path**: `/app/db`
   - **Size**: 1GB
4. **This ensures database persists between deployments**

### 5.2 Database Backup Strategy
Railway will handle:
- Automatic daily backups
- Point-in-time recovery
- Volume snapshots

## Step 6: Production Testing

### 6.1 Health Check
```bash
# Test basic connectivity
curl https://api.yachtcompany.com/health

# Expected response:
{
  "status": "healthy",
  "uptime": 1234,
  "timestamp": "2025-08-21T..."
}
```

### 6.2 Admin Access Test
```bash
# Test admin endpoints
curl -X POST "https://api.yachtcompany.com/admin/tenant" \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-company",
    "name": "Test Yacht Company"
  }'
```

### 6.3 API Functionality Test
```bash
# Test yacht search (should be empty for production clean)
curl -X GET "https://api.yachtcompany.com/yachts" \
  -H "X-Tenant-Id: test-company"

# Expected: {"items":[],"total":0}
```

## Step 7: Monitoring Setup

### 7.1 Railway Monitoring
Railway provides built-in:
- CPU and memory usage graphs
- Request volume and response times
- Error rate monitoring
- Deployment history

### 7.2 Custom Monitoring Endpoints
Your system includes:
```bash
# System metrics
curl https://api.yachtcompany.com/admin/metrics \
  -H "X-Admin-Key: your-admin-key"

# System status
curl https://api.yachtcompany.com/admin/status \
  -H "X-Admin-Key: your-admin-key"
```

## Step 8: Customer Data Import

### 8.1 Create Customer Tenant
```bash
curl -X POST "https://api.yachtcompany.com/admin/tenant" \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "luxury-yachts-monaco",
    "name": "Luxury Yachts Monaco",
    "fromName": "Monaco Luxury Charters",
    "fromEmail": "reservations@monacoyachts.com"
  }'
```

### 8.2 Import Yacht Fleet
```bash
# Upload customer's yacht data
curl -X POST "https://api.yachtcompany.com/admin/yachts/upload" \
  -H "X-Admin-Key: your-admin-key" \
  -H "X-Tenant-Id: luxury-yachts-monaco" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "SERENITY VII",
      "builder": "Benetti",
      "type": "Motor Yacht",
      "length": 52,
      "area": "Mediterranean",
      "cabins": 6,
      "guests": 12,
      "weeklyRate": 125000,
      "currency": "EUR"
    }
  ]'
```

## Step 9: Performance Optimization

### 9.1 Railway Resource Configuration
1. **Go to "Settings" → "Resources"**
2. **Recommended settings**:
   - **Memory**: 1GB (sufficient for SQLite + Node.js)
   - **CPU**: 1 vCPU (handles 100+ concurrent requests)
   - **Storage**: 2GB (database + logs)

### 9.2 Scaling Configuration
```
# In railway.toml (already included in your repo)
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
restartPolicyType = "always"

[[healthcheck]]
httpPath = "/health"
initialDelaySeconds = 30
periodSeconds = 10
```

## Step 10: Backup and Recovery

### 10.1 Database Backup
Your system includes automatic backup:
- Daily database snapshots
- 30-day retention
- One-click restore capability

### 10.2 Manual Backup
```bash
# Create manual backup
curl -X POST "https://api.yachtcompany.com/admin/backup" \
  -H "X-Admin-Key: your-admin-key"
```

## Step 11: Go-Live Checklist

### Before Customer Launch:
- [ ] Custom domain configured and SSL active
- [ ] Environment variables set correctly
- [ ] Admin key changed from default
- [ ] Customer tenant created
- [ ] Yacht fleet imported and verified
- [ ] SMTP configured (if applicable)
- [ ] Health checks passing
- [ ] API endpoints tested
- [ ] Monitoring configured
- [ ] Backup strategy verified

### Customer Handoff:
- [ ] Provide admin credentials
- [ ] Train customer team on dashboard
- [ ] Document API integration points
- [ ] Set up ongoing support process

## Pricing and Cost Management

### Railway Costs (Typical)
- **Pro Plan**: $5/month base
- **Usage**: ~$10-15/month for typical yacht company
- **Total**: ~$20/month hosting cost

### Customer Billing
- **Setup Fee**: $4,997 (includes deployment and configuration)
- **Monthly SaaS**: $997/month (includes hosting + support)
- **Hosting Cost**: Covered within SaaS fee

## Support and Maintenance

### Railway Support
- 24/7 platform monitoring
- Automatic scaling
- Security updates
- Infrastructure maintenance

### Your Support
- Application updates
- Feature enhancements
- Customer support
- Business logic changes

## Troubleshooting Common Issues

### Deployment Failed
1. Check "Deployments" tab for error logs
2. Verify package.json has correct start script
3. Check Node.js version compatibility

### Domain Not Working
1. Verify DNS CNAME record
2. Wait for DNS propagation (up to 24 hours)
3. Check Railway domain configuration

### Database Issues
1. Verify volume is mounted to `/app/db`
2. Check file permissions
3. Review application logs

### Performance Issues
1. Monitor resource usage in Railway dashboard
2. Scale up memory/CPU if needed
3. Review database query performance

## Conclusion

Railway deployment provides:
- **Professional hosting** with 99.9% uptime
- **Custom domains** with automatic SSL
- **Scalable infrastructure** that grows with customer needs
- **Built-in monitoring** and alerting
- **Automated backups** and recovery

Your Yacht Automate Brain is now production-ready on Railway, providing yacht companies with reliable, professional yacht charter automation.