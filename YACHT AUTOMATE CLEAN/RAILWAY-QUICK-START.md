# Railway Quick Start - 15-Minute Deployment

## Fastest Way to Deploy Yacht Automate Brain

### Step 1: Connect Repository (2 minutes)
1. Go to [railway.app](https://railway.app) → "New Project"
2. Select "Deploy from GitHub repo" 
3. Choose your yacht-automate repository
4. Click "Deploy Now"

### Step 2: Environment Variables (3 minutes)
In Railway project → "Variables" tab, add:
```
NODE_ENV=production
ADMIN_KEY=yacht-brain-secure-2025
PORT=5000
```

### Step 3: Test Deployment (2 minutes)
Railway gives you a URL like `yourapp.railway.app`
```bash
# Test health endpoint
curl https://yourapp.railway.app/health

# Should return: {"status":"healthy","uptime":123}
```

### Step 4: Custom Domain (5 minutes)
1. **Railway**: Settings → Domains → "Custom Domain"
2. **Enter**: `api.yachtcompany.com`
3. **Copy CNAME**: Railway gives you target like `xyz.railway.app`
4. **DNS**: Add CNAME record at your domain registrar
   - Name: `api`
   - Value: `xyz.railway.app`
5. **Wait**: 10-15 minutes for SSL certificate

### Step 5: Production Ready (3 minutes)
```bash
# Create first tenant
curl -X POST "https://api.yachtcompany.com/admin/tenant" \
  -H "X-Admin-Key: yacht-brain-secure-2025" \
  -H "Content-Type: application/json" \
  -d '{"id":"customer-company","name":"Customer Yacht Company"}'

# Test system
curl -X GET "https://api.yachtcompany.com/yachts" \
  -H "X-Tenant-Id: customer-company"
```

## You're Done! ✅

Your Yacht Automate Brain is now running on Railway with:
- **Professional hosting** with 99.9% uptime
- **Custom domain** with automatic SSL
- **Production environment** ready for customer data
- **Admin access** for system management

### Customer Deployment Cost
- **Railway hosting**: ~$15-20/month
- **Your SaaS fee**: $997/month (includes hosting)
- **Customer pays**: $997/month total

### Next Steps
1. Import customer's yacht fleet data
2. Configure their SMTP for email automation  
3. Train customer team on admin dashboard
4. Begin processing live yacht charter inquiries

The system is now production-ready for commercial yacht charter automation!