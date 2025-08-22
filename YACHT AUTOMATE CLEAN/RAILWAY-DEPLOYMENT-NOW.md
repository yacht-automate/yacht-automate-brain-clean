# Railway Deployment - Do This Now

## Step 1: Create Railway Account (2 minutes)

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with your GitHub account
4. Verify your email

## Step 2: Deploy from GitHub (3 minutes)

1. **In Railway Dashboard**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `yacht-automate-brain` repository
   - Click "Deploy Now"

2. **Railway will automatically**:
   - Detect Node.js project
   - Install dependencies 
   - Start the application
   - Give you a URL like `yourapp.railway.app`

## Step 3: Set Environment Variables (2 minutes)

In your Railway project:
1. Click "Variables" tab
2. Add these variables:

```
NODE_ENV=production
ADMIN_KEY=yacht-brain-railway-2025-secure
PORT=5000
ALLOWED_DOMAIN=*
```

3. Click "Deploy" to restart with new variables

## Step 4: Test Your Deployment (1 minute)

Railway gives you a URL. Test it:

```bash
# Replace with your Railway URL
curl https://yourapp.railway.app/health

# Should return:
{"status":"healthy","uptime":123,"timestamp":"..."}
```

## Step 5: Set Up Custom Domain (5 minutes)

### In Railway:
1. Go to Settings → Domains
2. Click "Custom Domain"
3. Enter: `api.yachtcompany.com` (or your domain)
4. Copy the CNAME target (like `abc123.railway.app`)

### In Your Domain Provider:
1. Go to DNS settings
2. Add CNAME record:
   - **Name**: `api`
   - **Value**: `abc123.railway.app` (from Railway)
   - **TTL**: 300

### Wait 10-15 minutes for SSL certificate

## Step 6: Create Your First Customer (2 minutes)

```bash
# Replace with your domain
curl -X POST "https://api.yachtcompany.com/admin/tenant" \
  -H "X-Admin-Key: yacht-brain-railway-2025-secure" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "luxury-charters-monaco",
    "name": "Luxury Charters Monaco",
    "fromName": "Monaco Luxury Yachts",
    "fromEmail": "reservations@monacoyachts.com"
  }'
```

## You're Live! ✅

Your Yacht Automate Brain is now running on Railway with:

- **Professional hosting** - 99.9% uptime
- **Custom domain** - Your branded API endpoint  
- **SSL certificate** - Automatic HTTPS
- **Production ready** - Ready for customer data

## Next: Import Customer Yacht Fleet

```bash
# Upload their real yachts
curl -X POST "https://api.yachtcompany.com/admin/yachts/upload" \
  -H "X-Admin-Key: yacht-brain-railway-2025-secure" \
  -H "X-Tenant-Id: luxury-charters-monaco" \
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

## Costs

- **Railway hosting**: ~$15-20/month
- **Your customer pays**: $997/month (includes hosting)
- **Your profit**: $977/month per customer

The system is now commercially ready for yacht charter automation!