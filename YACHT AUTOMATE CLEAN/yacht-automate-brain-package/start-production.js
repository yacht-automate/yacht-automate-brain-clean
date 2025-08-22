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
