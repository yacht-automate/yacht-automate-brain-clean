# 🚀 STEP 1: DEPLOY FOR REAL USE

## Railway Production Deployment

### Prerequisites Checklist:
- ✅ Railway account created
- ✅ GitHub repository with your code
- ✅ Production admin key configured
- ✅ SMTP credentials ready

### Deployment Steps:

**1. Prepare Environment Variables**
Create production .env file:
```env
NODE_ENV=production
ADMIN_KEY=yacht-brain-prod-2025-secure-key
ALLOWED_DOMAIN=yachtautomate.com
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production@gmail.com
SMTP_PASS=your-app-password
FROM_NAME=Yacht Charter Automation
FROM_EMAIL=your-production@gmail.com
```

**2. Deploy to Railway**
```bash
# Connect GitHub repository to Railway
# Set environment variables in Railway dashboard
# Deploy automatically from main branch
```

**3. Domain Setup**
```bash
# Custom domain: api.yachtautomate.com
# SSL certificate: Automatic via Railway
# DNS: Point CNAME to Railway URL
```

**4. Production Testing**
```bash
# Health check
curl -X GET "https://api.yachtautomate.com/health"

# Create first production tenant
curl -X POST "https://api.yachtautomate.com/admin/tenant" \
  -H "X-Admin-Key: yacht-brain-prod-2025-secure-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "first-client",
    "name": "First Charter Company",
    "fromName": "First Charters",
    "fromEmail": "bookings@firstcharters.com",
    "smtpHost": "smtp.firstcharters.com",
    "smtpUser": "system@firstcharters.com",
    "smtpPass": "client-smtp-password"
  }'
```

**5. Customer Onboarding Process**
```bash
# Step 1: Upload yacht inventory
curl -X POST "https://api.yachtautomate.com/admin/yachts/upload" \
  -H "X-Admin-Key: yacht-brain-prod-2025-secure-key" \
  -H "X-Tenant-Id: first-client" \
  -H "Content-Type: application/json" \
  -d '{"yachtData": [REAL_YACHT_DATA]}'

# Step 2: Test lead processing
curl -X POST "https://api.yachtautomate.com/lead" \
  -H "X-Tenant-Id: first-client" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@customer.com",
    "name": "Test Customer", 
    "notes": "Looking for Mediterranean yacht for 8 guests",
    "partySize": 8,
    "location": "Mediterranean"
  }'
```

## Expected Results:
- Production API running at custom domain
- Real customer leads processed automatically
- Professional emails sent with yacht recommendations
- Complete audit trail in database
- Daily backups to Railway persistent storage

## Success Metrics:
- 99.9% uptime
- < 500ms response times
- Zero data loss
- Professional email delivery
- Customer satisfaction with automated responses