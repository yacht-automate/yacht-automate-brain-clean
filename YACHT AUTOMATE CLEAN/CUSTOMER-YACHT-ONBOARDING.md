# Customer Yacht Fleet Onboarding Guide

## Real Client Fleet Integration

When you onboard a yacht charter company, you'll replace the demo yachts with their actual fleet using the production data import system.

## Method 1: JSON Import (Recommended)

**Customer provides yacht data in JSON format:**
```json
[
  {
    "name": "AZURE DREAMS",
    "builder": "Sunseeker",
    "type": "Motor Yacht",
    "length": 68,
    "area": "Mediterranean",
    "cabins": 4,
    "guests": 8,
    "weeklyRate": 185000,
    "currency": "EUR"
  },
  {
    "name": "OCEAN PEARL",
    "builder": "Princess",
    "type": "Motor Yacht", 
    "length": 40,
    "area": "Caribbean",
    "cabins": 3,
    "guests": 6,
    "weeklyRate": 95000,
    "currency": "USD"
  }
]
```

**Import via API:**
```bash
curl -X POST "https://yacht-automation.railway.app/admin/yachts/import" \
  -H "X-Admin-Key: your-admin-key" \
  -H "X-Tenant-Id: client-company-id" \
  -H "Content-Type: application/json" \
  -d @client-yacht-fleet.json
```

## Method 2: CSV Import

**Customer provides Excel/CSV file with columns:**
- Name, Builder, Type, Length, Area, Cabins, Guests, WeeklyRate, Currency

**Convert and import programmatically:**
```javascript
// Convert CSV to JSON then import via seedYachtsFromData()
const yachtData = convertCsvToJson(clientCsvFile);
const seeded = seedService.seedYachtsFromData(tenantId, yachtData);
```

## Method 3: Direct Database Integration

**For larger fleets, connect to client's existing systems:**
- Import from their yacht management software
- Sync with their booking calendar system  
- Pull from their CRM or ERP yacht inventory

## Demo vs Production Data

**Demo Data (40 yachts):**
- Used for demonstrations and testing
- Covers Mediterranean, Caribbean, Bahamas
- Realistic but fictional yacht names and specs
- Automatically seeded for demo tenants

**Production Data (Client's actual fleet):**
- Real yacht names, specs, and pricing
- Current availability and booking status
- Accurate area operations and restrictions
- Custom pricing rules and seasonal rates

## Onboarding Process

**Step 1: Remove Demo Data**
```bash
# Clear demo yachts for production tenant
curl -X DELETE "https://yacht-automation.railway.app/admin/yachts/clear" \
  -H "X-Admin-Key: your-admin-key" \
  -H "X-Tenant-Id: client-company-id"
```

**Step 2: Import Client Fleet**
```bash
# Import their actual yacht inventory
curl -X POST "https://yacht-automation.railway.app/admin/yachts/import" \
  -H "X-Admin-Key: your-admin-key" \
  -H "X-Tenant-Id: client-company-id" \
  -d @their-yacht-fleet.json
```

**Step 3: Configure Pricing & Areas**
- Set client's operating areas (Med only, Caribbean only, or both)
- Configure seasonal pricing adjustments
- Set up availability calendar integration
- Configure currency preferences

**Step 4: Test With Real Data**
```bash
# Test yacht matching with their fleet
curl -X GET "https://yacht-automation.railway.app/yachts?guests=8&area=Mediterranean" \
  -H "X-Tenant-Id: client-company-id"
```

## Data Validation

The system validates all yacht data:
- **Required fields**: name, builder, type, length, area, guests, weeklyRate
- **Numeric validation**: length, cabins, guests, weeklyRate
- **Enum validation**: area (Mediterranean/Caribbean/Bahamas), currency (EUR/USD)
- **Business rules**: guests <= cabins × 2, weeklyRate > 0

## Client Data Examples

**Mediterranean Charter Company:**
- 15-25 motor yachts from 30m to 80m
- Based in Monaco, French Riviera, Italian Riviera
- EUR pricing from €50,000 to €500,000/week
- High-end clientele, luxury specifications

**Caribbean Charter Fleet:**
- 10-20 catamarans and motor yachts
- Based in BVI, St. Lucia, Barbados
- USD pricing from $25,000 to $150,000/week  
- Mix of bareboat and crewed charters

**Bahamas Specialist:**
- 5-15 shallow draft vessels
- Day boats, sport fishers, small motor yachts
- USD pricing from $8,000 to $50,000/week
- Nassau, Exumas, Eleuthera operations

Your yacht automation system adapts to any client's fleet size, areas, and pricing structure. The demo data gets you started, but real client success comes from processing their actual yacht inventory and customer inquiries.