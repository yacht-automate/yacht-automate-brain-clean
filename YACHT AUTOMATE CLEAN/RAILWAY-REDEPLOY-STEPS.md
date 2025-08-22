# Railway Redeployment - Step by Step Guide

## Step 1: Push Fixed Code to GitHub

### Option A: Use Replit Git Panel
1. **Click Git tab** in left sidebar
2. **Add remote URL:** `https://github.com/yacht-automate/yacht-automate-brain-clean`
3. **Stage all changes** (look for + buttons next to files)
4. **Commit message:** "Fix Railway deployment with tier support and proper start scripts"
5. **Push to GitHub**

### Option B: Download and Upload Method
1. **Right-click in file area → Download as ZIP**
2. **Extract all files**
3. **Go to github.com/yacht-automate/yacht-automate-brain-clean**
4. **Delete all existing files** in the repository
5. **Upload all extracted files**
6. **Commit:** "Fix Railway deployment with tier support and proper start scripts"

## Step 2: Railway Deployment

### Create New Railway Project:
1. **Go to [railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose `yacht-automate-brain-clean`**
6. **Click "Deploy"**

### Environment Variables (Critical):
In Railway Dashboard → Variables tab, add:

```
NODE_ENV=production
ADMIN_KEY=yacht-automation-secure-2025-CHANGE-THIS
PORT=$PORT
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

## Step 3: Verify Deployment Success

### Check Build Logs:
- Railway Dashboard → Deployments → View Logs
- Should show: "Server listening on http://0.0.0.0:XXXX"
- No errors about missing start commands

### Test Health Endpoint:
```bash
curl https://your-app-name.railway.app/health
```
Should return: `{"status": "healthy", "timestamp": "..."}`

## Step 4: Test Tier System

### Create Different Tier Customers:
```bash
# Starter customer ($99/month)
curl -X POST "https://your-app-name.railway.app/admin/tenant" \
  -H "X-Admin-Key: yacht-automation-secure-2025-CHANGE-THIS" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "starter-demo",
    "name": "Starter Demo Company",
    "tier": "starter",
    "fromEmail": "demo@starter.com"
  }'

# Pro customer ($299/month)
curl -X POST "https://your-app-name.railway.app/admin/tenant" \
  -H "X-Admin-Key: yacht-automation-secure-2025-CHANGE-THIS" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "pro-demo", 
    "name": "Pro Demo Company",
    "tier": "pro",
    "fromEmail": "demo@pro.com"
  }'

# Enterprise customer ($599/month)
curl -X POST "https://your-app-name.railway.app/admin/tenant" \
  -H "X-Admin-Key: yacht-automation-secure-2025-CHANGE-THIS" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "enterprise-demo",
    "name": "Enterprise Demo Company", 
    "tier": "enterprise",
    "fromEmail": "demo@enterprise.com"
  }'
```

### Test Tier Restrictions:
```bash
# Should FAIL (Starter can't access analytics)
curl "https://your-app-name.railway.app/dashboard/analytics" \
  -H "X-Tenant-Id: starter-demo"

# Should WORK (Pro has analytics access)
curl "https://your-app-name.railway.app/dashboard/analytics" \
  -H "X-Tenant-Id: pro-demo"

# Should WORK (Enterprise has all features)
curl "https://your-app-name.railway.app/dashboard/analytics" \
  -H "X-Tenant-Id: enterprise-demo"
```

### Add Sample Yachts:
```bash
curl -X POST "https://your-app-name.railway.app/admin/yachts/seed" \
  -H "X-Admin-Key: yacht-automation-secure-2025-CHANGE-THIS" \
  -H "X-Tenant-Id: pro-demo"
```

### Test Complete Automation Flow:
```bash
curl -X POST "https://your-app-name.railway.app/integrations/form-to-lead" \
  -H "X-Tenant-Id: pro-demo" \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "test@client.com",
    "fullName": "John Smith", 
    "numberOfGuests": 8,
    "destination": "Mediterranean",
    "message": "Looking for luxury yacht charter"
  }'
```

## Step 5: Custom Domain (Optional)

### In Railway:
1. **Settings → Domains → Custom Domain**
2. **Enter:** `api.yachtautomation.com`
3. **Copy CNAME target**

### In Your Domain DNS:
1. **Add CNAME record:**
   - Name: `api`
   - Value: `your-app-name.railway.app`
   - TTL: 300

## Files That Fixed Railway Issues:

✅ **Updated railway.toml** - Proper start command
✅ **Created start.sh** - Backup startup script  
✅ **Tier system files** - Complete tier-based pricing
✅ **All automation features** - Form processing, email forwarding
✅ **Production hardening** - Security, monitoring, backups

## Expected Results:

- **Successful Railway build** with no start command errors
- **Tier-based customer management** working automatically
- **Complete yacht automation** processing leads instantly
- **Professional API** ready for yacht company integration
- **Revenue generation** at three pricing tiers

## Revenue Model Ready:
- **Starter:** $99/month - $20 hosting = $79 profit
- **Pro:** $299/month - $20 hosting = $279 profit
- **Enterprise:** $599/month - $20 hosting = $579 profit
- **Target:** 20 customers = $60,000-144,000/year

Your yacht automation business is ready for commercial launch!