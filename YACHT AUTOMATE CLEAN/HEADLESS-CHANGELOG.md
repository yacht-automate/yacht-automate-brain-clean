# Yacht Automate Brain - Headless v1.1 Changelog

## Major Changes from v1.0 to v1.1

### 🎯 Complete UI Removal (Breaking Changes)
- **Removed**: All HTML/CSS/JavaScript demo pages and forms
- **Removed**: Static file serving and templating engines
- **Removed**: Legal pages (`/privacy`, `/terms`) endpoints
- **Changed**: Root endpoint `/` now returns `{"error":"API only"}` instead of service info

### 🔧 New Integration Endpoints
- **Added**: `POST /integrations/form-to-lead` - Normalizes various form field formats to standard lead format
- **Added**: `POST /integrations/webhook` - Event dispatcher with retry logic for customer webhooks
- **Added**: Flexible field mapping for common form variations (email/Email/customerEmail, etc.)

### 🔒 Enhanced Security
- **Changed**: CORS configuration now uses `ALLOWED_ORIGINS` environment variable (CSV format)
- **Improved**: More restrictive CORS policy for production B2B integrations
- **Enhanced**: Middleware validation for headless-only operation

### 📚 Updated Documentation
- **Added**: `HEADLESS-MODE-READY.md` - Complete integration guide for customers
- **Added**: `RAILWAY-DEPLOYMENT-GUIDE.md` - Production hosting setup
- **Updated**: Console banner now shows "HEADLESS MODE" and updated API examples
- **Added**: Customer integration examples for WordPress, React, plain HTML

### 🚀 Performance & Architecture
- **Optimized**: Removed all UI dependencies and static asset handling
- **Streamlined**: Faster startup time without HTML rendering components
- **Enhanced**: Better logging for webhook events and form processing

### 💼 B2B Integration Ready
- **Feature**: Support for multiple form field naming conventions
- **Feature**: Webhook event system for customer CRM integration
- **Feature**: Pure JSON responses for all endpoints
- **Feature**: Environment-based tenant origin configuration

## Migration Guide

### For Existing Integrations
1. **Demo page removed**: Update any links to `/demo` endpoint
2. **Root endpoint changed**: Update health checks to use `/health` instead of `/`
3. **CORS configuration**: Set `ALLOWED_ORIGINS` environment variable

### For New Customer Integrations
1. Use `POST /integrations/form-to-lead` for website form processing
2. Configure `ALLOWED_ORIGINS` to include customer domains
3. Set up webhook endpoints with `POST /integrations/webhook`

### Environment Variables
```bash
# Required for production
ADMIN_KEY=your-secure-admin-key
ALLOWED_ORIGINS=https://client1.com,https://client2.com

# Optional for email automation
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
FROM_NAME=Charter Automation
FROM_EMAIL=charters@yourdomain.com
```

## Breaking Changes Summary
- All UI endpoints removed (breaking change for any UI dependencies)
- Root endpoint behavior changed from info display to error response
- CORS configuration now requires explicit origin configuration

## Backward Compatibility
- All core API endpoints unchanged (`/yachts`, `/lead`, `/quote/calc`, etc.)
- Database schema unchanged - no migration required
- Admin endpoints unchanged (`/admin/tenant`, `/admin/yachts/seed`, etc.)
- Authentication headers unchanged (`X-Tenant-Id`, `X-Admin-Key`)

## Version Info
- **Previous**: v1.0 (UI + API)
- **Current**: v1.1 (Pure API/Headless)
- **Architecture**: Multi-tenant B2B API backend
- **Target**: Yacht charter companies for website integration