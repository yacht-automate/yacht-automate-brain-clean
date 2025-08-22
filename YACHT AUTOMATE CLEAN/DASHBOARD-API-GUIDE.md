# Dashboard API - Analytics and Reporting Guide

## Overview

The Yacht Automate Brain now includes a comprehensive Dashboard API for analytics and reporting. This provides yacht companies with powerful insights into lead conversion, performance metrics, and business analytics.

## Features

### Core Analytics
- ✅ **Lead Analytics**: Total leads, conversion rates, status tracking, geographic distribution
- ✅ **Quote Metrics**: Quote volume, average values, revenue calculations, conversion trends  
- ✅ **Yacht Performance**: Popular yachts, area distribution, type analysis, booking statistics
- ✅ **Revenue Analytics**: Total revenue, area-based performance, top-performing yachts
- ✅ **Customer Insights**: Party size distribution, repeat customers, lifetime value
- ✅ **Time-based Trends**: Daily/weekly/monthly patterns, conversion trends over time
- ✅ **Real-time Metrics**: Live dashboard updates, current activity monitoring
- ✅ **Data Export**: CSV and JSON export capabilities for external reporting

## API Endpoints

### Admin Dashboard Endpoints (Require X-Admin-Key)

#### 1. Get Comprehensive Dashboard Metrics
```bash
GET /dashboard/metrics/:tenantId?startDate=2025-08-01&endDate=2025-08-20
Headers: X-Admin-Key: yacht-brain-prod-2025-secure-key
```

**Response includes:**
- Lead metrics (total, today, weekly, monthly, by status)
- Quote metrics (total, conversion rates, average values)
- Yacht analytics (total, by area/type, popular yachts)
- Revenue metrics (total revenue, by area, top performers)
- Time-based analytics (daily trends, conversion patterns)
- Geographic analytics (leads by location, revenue by area)
- Customer analytics (party sizes, repeat customers, lifetime value)

#### 2. Get Live Metrics
```bash
GET /dashboard/live/:tenantId
Headers: X-Admin-Key: yacht-brain-prod-2025-secure-key
```

**Real-time metrics:**
- Recent leads (last hour)
- Recent quotes (last hour)  
- Today's activity summary
- Current revenue totals

#### 3. Export Dashboard Data
```bash
GET /dashboard/export/:tenantId?format=csv&startDate=2025-08-01&endDate=2025-08-20
Headers: X-Admin-Key: yacht-brain-prod-2025-secure-key
```

**Export formats:**
- `format=json`: Complete metrics in JSON format
- `format=csv`: Key metrics in CSV format for spreadsheets

### Tenant Dashboard Endpoints (Require X-Tenant-Id)

#### 4. Get Dashboard Overview
```bash
GET /dashboard/overview
Headers: X-Tenant-Id: your-tenant-id
```

**Simplified tenant view:**
- Lead summary (total, today, week, month, by status)
- Quote overview (total, today, average value, conversion rate)
- Yacht metrics (total, by area, top 5 popular)
- System performance (response time, uptime)

#### 5. Get Chart Data
```bash
GET /dashboard/charts?type=leads&days=30
Headers: X-Tenant-Id: your-tenant-id
```

**Chart types:**
- `type=leads`: Lead trends, locations, status distribution
- `type=quotes`: Quote volume, conversion trends
- `type=revenue`: Revenue by area, top performing yachts
- `type=customers`: Party size distribution, customer analytics
- `type=summary` (default): 14-day overview charts

## Testing the Dashboard API

### 1. Set up test data
```bash
# Create tenant
curl -X POST "http://localhost:5000/admin/tenant" \
  -H "X-Admin-Key: yacht-brain-prod-2025-secure-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "analytics-demo",
    "name": "Analytics Demo Charter",
    "fromName": "Analytics Demo",
    "fromEmail": "demo@analytics.com"
  }'

# Seed yachts
curl -X POST "http://localhost:5000/admin/yachts/seed" \
  -H "X-Admin-Key: yacht-brain-prod-2025-secure-key" \
  -H "X-Tenant-Id: analytics-demo"
```

### 2. Generate sample leads
```bash
# Create some sample leads for analytics
curl -X POST "http://localhost:5000/integrations/form-to-lead" \
  -H "X-Tenant-Id: analytics-demo" \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "client1@example.com",
    "fullName": "John Smith",
    "numberOfGuests": 8,
    "destination": "Mediterranean",
    "message": "Looking for luxury yacht charter"
  }'

curl -X POST "http://localhost:5000/integrations/form-to-lead" \
  -H "X-Tenant-Id: analytics-demo" \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "client2@example.com", 
    "fullName": "Sarah Johnson",
    "numberOfGuests": 4,
    "destination": "Bahamas",
    "message": "Family vacation charter"
  }'
```

### 3. Test dashboard endpoints
```bash
# Get full metrics
curl -X GET "http://localhost:5000/dashboard/metrics/analytics-demo" \
  -H "X-Admin-Key: yacht-brain-prod-2025-secure-key"

# Get tenant overview  
curl -X GET "http://localhost:5000/dashboard/overview" \
  -H "X-Tenant-Id: analytics-demo"

# Get chart data
curl -X GET "http://localhost:5000/dashboard/charts?type=leads&days=7" \
  -H "X-Tenant-Id: analytics-demo"

# Export data as CSV
curl -X GET "http://localhost:5000/dashboard/export/analytics-demo?format=csv" \
  -H "X-Admin-Key: yacht-brain-prod-2025-secure-key"
```

## Dashboard Metrics Explained

### Lead Analytics
- **Total Leads**: All-time lead count for the tenant
- **Leads Today/Week/Month**: Time-filtered lead counts
- **Leads by Status**: Distribution across lead stages
- **Conversion Rate**: Percentage of leads that generate quotes

### Revenue Analytics
- **Total Revenue**: Sum of all quote values
- **Revenue by Area**: Performance across Mediterranean, Caribbean, Bahamas
- **Average Charter Value**: Mean quote value
- **Top Performing Yachts**: Highest revenue generating yachts

### Customer Insights
- **Average Party Size**: Mean number of guests per charter
- **Party Size Distribution**: Guest count patterns
- **Repeat Customers**: Customers with multiple leads
- **Customer Lifetime Value**: Average revenue per customer

### Performance Metrics
- **Response Time**: Average API response time
- **System Uptime**: Service availability percentage
- **Email Delivery**: SMTP success rates (when configured)

## Integration with External Tools

### Business Intelligence
The CSV export feature allows integration with:
- Excel/Google Sheets for custom reporting
- Power BI for advanced visualizations  
- Tableau for comprehensive business intelligence
- Custom reporting systems via JSON API

### Automated Reporting
Set up automated daily/weekly reports:
```bash
# Daily export script
#!/bin/bash
DATE=$(date +%Y-%m-%d)
curl -X GET "http://localhost:5000/dashboard/export/your-tenant?format=csv" \
  -H "X-Admin-Key: your-admin-key" \
  > "daily-report-$DATE.csv"
```

## Security and Access Control

### Admin Access
- Full dashboard metrics require admin key authentication
- Access to all tenant data and system metrics
- Export capabilities for compliance and reporting

### Tenant Access  
- Tenant-scoped dashboard overview
- No admin key required, uses tenant ID header
- Limited to tenant's own data only

## Production Deployment Notes

### Performance Considerations
- Dashboard queries are optimized for SQLite performance
- Date range filtering reduces query complexity
- Caching recommended for high-traffic deployments

### Monitoring Integration
- All dashboard access is logged via audit system
- Metrics collection tracks dashboard usage
- Performance monitoring for query execution times

## Next Steps

The Dashboard API is now production-ready and provides:

1. **Complete Analytics Suite** - All key metrics for yacht charter businesses
2. **Multi-tenant Security** - Proper data isolation and access controls
3. **Export Capabilities** - Integration with external reporting tools
4. **Real-time Updates** - Live metrics for operational monitoring
5. **Audit Logging** - Full tracking of dashboard usage

This system enables yacht companies to make data-driven decisions and optimize their charter operations based on comprehensive business intelligence.