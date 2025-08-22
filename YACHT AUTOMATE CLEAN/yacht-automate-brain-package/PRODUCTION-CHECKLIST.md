# Production Deployment Checklist

## Pre-Deployment Preparation

### ✅ Clean Demo Data
```bash
node clean-demo.js
```

### ✅ Test System Locally
```bash
npm run dev
# Test health endpoint: curl http://localhost:5000/health
```

## Railway Deployment

### ✅ Environment Variables
Set these in Railway dashboard:
- `ADMIN_KEY`: Strong password (e.g., `yacht-brain-2024-prod-key`)
- `NODE_ENV`: `production`

### ✅ Connect Repository
1. Push code to GitHub
2. Connect GitHub repo to Railway
3. Deploy automatically

### ✅ Verify Deployment
- Health check: `https://your-app.railway.app/health`
- Should return: `{"status":"ok","timestamp":"...","environment":"production"}`

## Post-Deployment Setup

### ✅ Create First Tenant
```bash
curl -X POST https://your-app.railway.app/admin/tenants \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Charter Company",
    "smtpConfig": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "user": "your-email@domain.com",
      "pass": "your-app-password"
    }
  }'
```

### ✅ Test Core Functionality
1. Yacht search with tenant ID
2. Lead creation
3. Quote calculation
4. Email processing (if SMTP configured)

## Ready for Customers

### ✅ API Documentation
- Provide customers with API endpoints
- Share tenant ID for their requests
- Document required headers (`X-Tenant-Id`)

### ✅ Monitoring Setup
- Monitor Railway logs
- Set up uptime monitoring
- Track API usage

## Sales-Ready Features

✅ **Multi-tenant isolation** - Each customer's data is completely separate  
✅ **Production-grade logging** - Full audit trail and debugging  
✅ **Rate limiting** - 60 requests/minute protection  
✅ **Email automation** - Automated responses to leads  
✅ **Quote calculation** - APA, VAT, and total pricing  
✅ **Yacht matching** - Intelligent yacht recommendations  
✅ **Background processing** - Reliable email queue system  

## Pricing Model Suggestions

### Basic Plan: $99/month
- 1,000 API calls
- 1 tenant
- Email automation
- Basic support

### Professional: $299/month  
- 10,000 API calls
- 5 tenants
- Priority email processing
- Phone support

### Enterprise: Custom
- Unlimited API calls
- Unlimited tenants
- Custom integrations
- Dedicated support

Ready to start selling! 🎯