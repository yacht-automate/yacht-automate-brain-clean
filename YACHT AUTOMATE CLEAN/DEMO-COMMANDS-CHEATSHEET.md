# 🎯 DEMO COMMANDS CHEAT SHEET

## Quick Copy-Paste Commands for Live Demos

**Replace `YOUR-RAILWAY-URL` with your actual Railway deployment URL**

### 1. Health Check (Show System is Live)
```bash
curl https://YOUR-RAILWAY-URL/health
```

### 2. Create Demo Tenant (Setup)
```bash
curl -X POST "https://YOUR-RAILWAY-URL/admin/tenant" \
  -H "X-Admin-Key: demo-yacht-2025-secure" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "demo-charter",
    "name": "Demo Charter Company", 
    "fromName": "Demo Yacht Charters",
    "fromEmail": "demo@yachtcharters.com"
  }'
```

### 3. Load Sample Yachts (Demo Data)
```bash
curl -X POST "https://YOUR-RAILWAY-URL/admin/yachts/seed" \
  -H "X-Admin-Key: demo-yacht-2025-secure" \
  -H "X-Tenant-Id: demo-charter"
```

### 4. Demo Lead #1 - Mediterranean Family (Main Demo)
```bash
curl -X POST "https://YOUR-RAILWAY-URL/lead" \
  -H "X-Tenant-Id: demo-charter" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.johnson@email.com",
    "name": "Sarah Johnson",
    "notes": "Looking for luxury Mediterranean yacht for our family of 6, including 2 teenagers. We want water sports and modern amenities. Budget around €120,000 per week.",
    "partySize": 6,
    "location": "Mediterranean",
    "budget": 120000
  }'
```

### 5. Demo Lead #2 - Caribbean Corporate (Alternative)
```bash
curl -X POST "https://YOUR-RAILWAY-URL/lead" \
  -H "X-Tenant-Id: demo-charter" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "events@techcorp.com",
    "name": "Michael Chen",
    "notes": "Corporate retreat in the Caribbean for 12 executives. Need professional catering and conference facilities. Budget flexible up to $200k.",
    "partySize": 12,
    "location": "Caribbean",  
    "budget": 200000
  }'
```

### 6. Search Yachts (Show Inventory)
```bash
curl -X GET "https://YOUR-RAILWAY-URL/yachts?area=Mediterranean&guests=8&limit=5" \
  -H "X-Tenant-Id: demo-charter"
```

### 7. Calculate Quote (Show Pricing Logic)
```bash
# First get a yacht ID from search results, then:
curl -X POST "https://YOUR-RAILWAY-URL/quote/calc" \
  -H "X-Tenant-Id: demo-charter" \
  -H "Content-Type: application/json" \
  -d '{
    "yachtId": "YACHT_ID_FROM_SEARCH",
    "weeks": 1,
    "extras": 10000
  }'
```

### 8. Email Ingestion Demo (Advanced)
```bash
curl -X POST "https://YOUR-RAILWAY-URL/ingest/email" \
  -H "X-Tenant-Id: demo-charter" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "inquiry@customer.com",
    "subject": "Yacht charter inquiry for 8 guests",
    "body": "Hi, we are looking to charter a yacht in the Mediterranean for 8 people in July. Our budget is around €100k per week. We prefer motor yachts with water toys."
  }'
```

## Demo Flow Script

### Opening (30 seconds):
**"Let me show you how a customer inquiry gets processed in your system..."**

**Say**: "This is a live production system running on Railway. Let me submit an actual customer inquiry."

### Main Demo (2 minutes):

**Step 1**: Submit Demo Lead #1 (Mediterranean Family)
**Say**: "A family inquiry just came in - looking for Mediterranean yacht, 6 guests, €120k budget"

**Step 2**: Show the JSON response  
**Say**: "In 0.8 seconds, the system found 4 perfect yacht matches, ranked by price within their budget"

**Step 3**: Show quote calculation
**Say**: "Let me calculate the full quote with APA and VAT"

**Step 4**: Point out key features
**Say**: "Notice the system automatically calculated 25% APA, 22% Mediterranean VAT, and formatted everything professionally"

### Closing (30 seconds):
**"This entire process took 60 seconds. Your current manual process takes how long?"**
**"The system works 24/7. How many leads do you lose at night and weekends?"**

## Expected Results to Highlight

### Lead Processing Success:
```json
{
  "success": true,
  "lead": {"status": "new", "email": "sarah.johnson@email.com"},
  "candidates": [4 yachts found],
  "matchCount": 4
}
```
**Highlight**: "Found 4 matches in under 1 second"

### Quote Calculation Success:
```json
{
  "success": true,
  "quote": {
    "basePrice": 95000,
    "apa": 23750,
    "vat": 20900,
    "total": 149650,
    "currency": "EUR"
  }
}
```
**Highlight**: "Professional quote with industry-standard APA and VAT calculations"

## Common Questions & Responses

### "How accurate is the yacht matching?"
**Demo Response**: "Let me show you" → Run yacht search command
**Result**: Show exact matches for guest capacity, location, and budget

### "What about quote calculations?"
**Demo Response**: "Here's the breakdown" → Run quote calculation  
**Result**: Show APA (25%), VAT (22% Mediterranean), and total

### "How fast is it really?"
**Demo Response**: Time the lead submission → Show response in < 1 second
**Result**: "Faster than manual search through your inventory"

### "Can it handle complex requests?"
**Demo Response**: Use email ingestion with natural language
**Result**: System parses unstructured text into structured requirements

## Pre-Demo Checklist

Before each customer demo:
- [ ] Verify Railway URL is working (health check)
- [ ] Confirm demo tenant exists and has yacht data
- [ ] Test lead submission works end-to-end  
- [ ] Practice timing and smooth delivery
- [ ] Have backup commands ready if something fails
- [ ] Screenshot key results for presentation slides

## Post-Demo Follow-up

### What to send after demo:
1. **Screenshots** of the live results they just saw
2. **ROI calculation** specific to their business size
3. **Implementation timeline** (usually 1-2 weeks)
4. **Pricing proposal** with their requirements
5. **Next steps** calendar link for technical discussion

**Your live demo system proves the value instantly - use it to close deals!**