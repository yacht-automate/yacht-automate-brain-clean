#!/bin/bash

# Yacht Automate Brain - Package for Download Script

echo "📦 Packaging Yacht Automate Brain for download..."

# Create package directory
mkdir -p yacht-automate-brain-package
cd yacht-automate-brain-package

# Copy essential files
cp -r ../src ./
cp -r ../db ./
cp ../package.json ./
cp ../package-lock.json ./
cp ../tsconfig.json ./
cp ../railway.toml ./
cp ../.env.example ./

# Copy documentation
cp ../README.md ./
cp ../DEPLOYMENT.md ./
cp ../PRODUCTION-CHECKLIST.md ./
cp ../SALES-PACKAGE.md ./
cp ../replit.md ./TECHNICAL-ARCHITECTURE.md

# Copy utility scripts
cp ../clean-demo.js ./
cp ../package-for-download.sh ./

# Create production start script
cat > start-production.js << 'EOF'
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Yacht Automate Brain in production mode...');

// Set production environment
process.env.NODE_ENV = 'production';

// Start the server
const server = spawn('npx', ['ts-node', 'src/index.ts'], {
  stdio: 'inherit',
  cwd: __dirname
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.kill('SIGTERM');
});
EOF

# Create installation script
cat > INSTALL.md << 'EOF'
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
EOF

# Create package info
cat > PACKAGE-INFO.txt << 'EOF'
YACHT AUTOMATE BRAIN - PRODUCTION PACKAGE
========================================

Version: 1.0.0
Build Date: $(date)
Package Contents:

Core System:
- src/ - Complete TypeScript source code
- package.json - Node.js dependencies
- tsconfig.json - TypeScript configuration

Configuration:
- .env.example - Environment variables template
- railway.toml - Railway deployment config

Documentation:
- README.md - Project overview
- DEPLOYMENT.md - Railway deployment guide  
- PRODUCTION-CHECKLIST.md - Go-live checklist
- TECHNICAL-ARCHITECTURE.md - System architecture
- SALES-PACKAGE.md - Sales and marketing materials
- INSTALL.md - Quick installation guide

Utilities:
- clean-demo.js - Remove demo data
- start-production.js - Production startup script

Database:
- db/ - SQLite database directory (empty, created on startup)

Ready for production deployment! 🚀

Support: Contact your sales representative
Documentation: See included markdown files
License: As per purchase agreement
EOF

cd ..

echo "✅ Package created in yacht-automate-brain-package/"
echo ""
echo "📋 Package contents:"
ls -la yacht-automate-brain-package/
echo ""
echo "🎯 Ready for download and deployment!"
echo "   - Compress the yacht-automate-brain-package/ folder"
echo "   - Send to customer with INSTALL.md instructions"
echo "   - They can deploy to Railway in under 10 minutes"