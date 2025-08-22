# How to Set Customer Tiers - Complete Guide

## Creating Tenants with Specific Tiers

When you deploy to Railway, here's exactly how to create customers with different pricing tiers:

### Starter Tier Customer ($99/month)

```bash
curl -X POST "https://api.yachtautomation.com/admin/tenant" \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "small-yacht-company",
    "name": "Small Yacht Company",
    "tier": "starter",
    "fromEmail": "bookings@smallyachts.com",
    "fromName": "Small Yacht Charters"
  }'
```

**Starter Features:**
- ✅ Basic inquiry processing and auto-quotes
- ✅ Email responses with yacht recommendations  
- ✅ Lead forwarding to existing workflow
- ❌ No analytics dashboard access
- ❌ No custom branding
- ❌ No webhook support
- **Max Yachts:** 10

### Pro Tier Customer ($299/month)

```bash
curl -X POST "https://api.yachtautomation.com/admin/tenant" \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "midsize-charter-co",
    "name": "Midsize Charter Company",
    "tier": "pro",
    "fromEmail": "reservations@midsizecharters.com",
    "fromName": "Midsize Charter Specialists"
  }'
```

**Pro Features:**
- ✅ All Starter features
- ✅ Full analytics dashboard access
- ✅ Custom branded proposals with photos
- ✅ CRM webhooks and business intelligence
- ✅ Advanced reporting and CSV export
- **Max Yachts:** 50

### Enterprise Tier Customer ($599/month)

```bash
curl -X POST "https://api.yachtautomation.com/admin/tenant" \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "luxury-yacht-fleet",
    "name": "Luxury Yacht Fleet Inc",
    "tier": "enterprise",
    "fromEmail": "concierge@luxuryyachtfleet.com",
    "fromName": "Luxury Yacht Concierge"
  }'
```

**Enterprise Features:**
- ✅ All Pro features
- ✅ Priority support
- ✅ Custom integrations and dedicated account manager
- ✅ Advanced multi-tenant isolation
- ✅ Unlimited customizations
- **Max Yachts:** 999

## What Happens with Different Tiers

### Automatic Feature Control

The system automatically enforces tier limits:

**Starter Customers:**
- Dashboard routes return "Feature requires Pro or Enterprise tier"
- Webhook endpoints disabled
- Custom branding disabled
- Limited to 10 yachts maximum

**Pro Customers:**
- Full dashboard analytics access
- Webhook support enabled
- Custom branding available
- Advanced reporting and exports

**Enterprise Customers:**
- All features unlocked
- Priority support flags enabled
- Custom integration capabilities
- Unlimited yacht capacity

### Testing Different Tiers

After creating customers, test their access:

```bash
# Test Starter customer (should fail for analytics)
curl -X GET "https://api.yachtautomation.com/dashboard/analytics" \
  -H "X-Tenant-Id: small-yacht-company"
# Returns: {"error": "Feature requires Pro or Enterprise tier"}

# Test Pro customer (should work)
curl -X GET "https://api.yachtautomation.com/dashboard/analytics" \
  -H "X-Tenant-Id: midsize-charter-co"
# Returns: Full analytics data

# Test Enterprise customer (should work with all features)
curl -X GET "https://api.yachtautomation.com/dashboard/analytics" \
  -H "X-Tenant-Id: luxury-yacht-fleet"
# Returns: Full analytics data + enterprise features
```

## Upgrading Customer Tiers

To upgrade a customer from Starter to Pro:

```bash
curl -X POST "https://api.yachtautomation.com/admin/tenant" \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "small-yacht-company",
    "name": "Small Yacht Company",
    "tier": "pro",
    "fromEmail": "bookings@smallyachts.com"
  }'
```

The system automatically updates their access to Pro features.

## Revenue Tracking by Tier

Your monthly revenue per customer:

**Starter Customers:** $99/month - $20 hosting = **$79 profit**
**Pro Customers:** $299/month - $20 hosting = **$279 profit**  
**Enterprise Customers:** $599/month - $20 hosting = **$579 profit**

## Default Tier Behavior

If you don't specify a tier, customers default to "starter":

```bash
# This creates a Starter tier customer automatically
curl -X POST "https://api.yachtautomation.com/admin/tenant" \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "default-customer",
    "name": "Default Customer"
  }'
```

## Summary

**One system, three pricing tiers:**
- Use the same Railway deployment for all customers
- Specify tier during tenant creation: `"tier": "starter"`, `"tier": "pro"`, or `"tier": "enterprise"`
- System automatically enforces feature access based on tier
- Upgrade customers by updating their tier
- No need for separate systems or downloads

Your complete yacht automation system handles all tiers automatically through a single codebase deployed to Railway.