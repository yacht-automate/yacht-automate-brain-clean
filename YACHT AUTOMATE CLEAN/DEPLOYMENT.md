# Yacht Automate - Railway Deployment Guide

## Quick Deployment Steps

### 1. Prepare the Code
```bash
# Remove demo data and clean the system
npm run clean-demo
```

### 2. Deploy to Railway
1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard:
   - `ADMIN_KEY`: Your secure admin key (e.g., `yacht-admin-2024-secure`)
   - `NODE_ENV`: `production`

### 3. Domain Setup
- Railway will provide a `.railway.app` domain automatically
- For custom domains, add them in Railway dashboard

### 4. Test the Deployment
```bash
# Health check
curl https://your-app.railway.app/health

# Create a tenant
curl -X POST https://your-app.railway.app/admin/tenants \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Your Charter Company", "smtpConfig": {...}}'
```

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `ADMIN_KEY` | Secure admin key for API access | `yacht-admin-2024-secure` |
| `NODE_ENV` | Environment mode | `production` |

## Optional SMTP Configuration (Per Tenant)
Set via tenant creation API:
- `host`: SMTP server host
- `port`: SMTP port (587 for TLS, 465 for SSL)
- `secure`: Boolean for SSL
- `user`: SMTP username
- `pass`: SMTP password

## Production Features
✅ Multi-tenant architecture with tenant isolation  
✅ Rate limiting (60 requests/minute)  
✅ SQLite database with WAL mode  
✅ Background email processing with retries  
✅ Comprehensive logging and audit trails  
✅ Input validation and error handling  
✅ CORS support for web integration  

## API Endpoints
- `GET /health` - Health check
- `POST /admin/tenants` - Create tenant
- `GET /admin/tenants` - List tenants  
- `POST /yachts/search` - Search yachts
- `POST /leads` - Create lead
- `POST /quotes` - Calculate quote
- `POST /email/ingest` - Process email lead

## Scaling Considerations
- SQLite handles up to 100k requests/day efficiently
- For higher loads, consider PostgreSQL migration
- Background job processing scales with server resources
- Database backups recommended for production data

## Security Features
- Admin key authentication
- Tenant data isolation
- Request validation
- Rate limiting
- CORS protection