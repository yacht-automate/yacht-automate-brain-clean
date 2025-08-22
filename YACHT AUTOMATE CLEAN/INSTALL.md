# Installation Instructions

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start the Server
```bash
# Development
npm run dev

# Production
node start-production.js
```

### 4. Test the API
```bash
curl http://localhost:5000/health
```

## Railway Deployment (Recommended)

1. Push to GitHub
2. Connect to Railway
3. Set environment variables in Railway dashboard
4. Deploy automatically

See DEPLOYMENT.md for detailed instructions.

## What's Next?

1. Create your first tenant via `/admin/tenants`
2. Add your yacht inventory
3. Test lead processing and quotes
4. Configure SMTP for email automation

Your yacht charter automation system is ready! 🛥️
