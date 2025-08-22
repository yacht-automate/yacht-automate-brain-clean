#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning demo data for production deployment...');

// Remove demo database
const dbPath = 'db/data.sqlite';
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Demo database removed');
} else {
  console.log('ℹ️  No demo database found');
}

// Remove demo environment files
const demoEnv = '.env';
if (fs.existsSync(demoEnv)) {
  fs.unlinkSync(demoEnv);
  console.log('✅ Demo environment file removed');
}

// Create production-ready directory structure
if (!fs.existsSync('db')) {
  fs.mkdirSync('db', { recursive: true });
  console.log('✅ Database directory created');
}

console.log('\n🚀 System is now production-ready!');
console.log('\nNext steps:');
console.log('1. Deploy to Railway');
console.log('2. Set ADMIN_KEY environment variable');
console.log('3. Test with /health endpoint');
console.log('4. Create your first tenant via /admin/tenants');

console.log('\nℹ️  Fresh database will be created automatically on first startup');