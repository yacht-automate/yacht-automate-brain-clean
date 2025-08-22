# Yacht Automate - Brain API

## Overview

Yacht Automate Brain is a production-lean API-only service designed to automate yacht charter business operations. The system processes leads, matches them to available yachts, calculates charter quotes, and sends automated email responses. Built as a multi-tenant solution, it serves as the "brain" for yacht charter companies by handling the entire lead-to-quote workflow without requiring a user interface.

The system is designed to be lightweight, production-ready, and focused solely on automation - accepting leads via API or email ingestion, parsing customer intent, matching to an internal yacht knowledge base, and responding with personalized yacht options and pricing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Technology Stack
- **Runtime**: Node.js 20 with TypeScript for type safety and modern JavaScript features
- **Web Framework**: Fastify for high-performance HTTP API with built-in logging via Pino
- **Database**: SQLite with better-sqlite3 for file-based data storage, using WAL mode for performance
- **Queue System**: BullMQ-lite for in-process background job processing (email sending)
- **Email**: Nodemailer with SMTP integration and console fallback for development
- **Validation**: Zod for schema validation and type safety
- **Configuration**: dotenv for environment variable management

### Multi-Tenant Architecture
The system implements a lightweight multi-tenancy model where:
- Every API request requires an `X-Tenant-Id` header (except health and admin endpoints)
- All data tables include a `tenantId` column for data isolation
- Tenant-specific SMTP configurations are stored per tenant
- Admin operations require an `X-Admin-Key` header for security

### Database Design
Uses SQLite with five core tables:
- **tenants**: Store tenant information and SMTP credentials
- **yachts**: Yacht inventory with specifications (type, area, capacity, pricing)
- **leads**: Customer inquiries with parsed intent and status tracking
- **quotes**: Generated quote breakdowns linked to leads
- **events**: Comprehensive audit log for all system operations

### Yacht Matching Algorithm
Implements a sophisticated scoring system that:
- Tokenizes customer queries for semantic matching
- Enforces strict guest capacity requirements (configurable)
- Maps location keywords to yacht operating areas (Mediterranean, Caribbean, Bahamas)
- Scores matches based on area relevance, type matching, and query tokens
- Sorts results by match score, then by price

### Quote Calculation Engine
Provides detailed charter cost breakdowns including:
- Base charter fee (yacht weekly rate × duration)
- APA (Advance Provisioning Allowance) at 25% of base cost
- VAT calculations based on operating area (22% for Mediterranean, 0% for Caribbean/Bahamas)
- Additional extras and total cost calculation
- Multi-currency support with proper formatting

### Email Automation System
Features a flexible email system that:
- Uses per-tenant SMTP configuration stored in database
- Falls back to console logging when SMTP is not configured
- Processes emails via background job queue with retry logic
- Generates personalized responses with yacht recommendations
- Tracks all email attempts in the events audit log

### Security and Rate Limiting
Implements essential security measures:
- Admin key authentication for administrative endpoints
- Rate limiting (60 requests per minute per IP)
- Request payload validation using Zod schemas
- CORS support for cross-origin requests
- Comprehensive input sanitization and validation

### Observability and Logging
Provides full system visibility through:
- Structured logging with Pino (pretty printing in development)
- Comprehensive event tracking for all operations
- Tenant ID logging for multi-tenant debugging
- Request/response logging with performance metrics
- Error tracking and audit trails

## External Dependencies

### Core Runtime Dependencies
- **better-sqlite3**: Native SQLite driver for high-performance database operations
- **fastify**: Modern web framework with built-in validation and serialization
- **nodemailer**: Email sending library with SMTP transport support
- **bullmq-lite**: Lightweight in-process job queue for background tasks
- **pino/pino-pretty**: Structured logging with development-friendly formatting
- **zod**: Schema validation and TypeScript integration
- **dotenv**: Environment variable loading and configuration management

### Development Dependencies
- **TypeScript**: Static typing and modern JavaScript compilation
- **ts-node**: Direct TypeScript execution without compilation step
- **@types/node**: Node.js type definitions
- **@types/nodemailer**: Nodemailer type definitions

### SMTP Integration
The system integrates with tenant-provided SMTP services for email delivery:
- Configurable SMTP host, port, and authentication per tenant
- Support for secure (SSL/TLS) and non-secure connections
- Automatic fallback to console logging when SMTP is unavailable
- Per-tenant email branding (from name and email address)

### Database Storage
Uses SQLite as the primary data store with:
- File-based storage at `db/data.sqlite`
- WAL (Write-Ahead Logging) mode for improved concurrency
- Foreign key constraints enabled for referential integrity
- Automatic directory creation for database file location

The system is designed to be self-contained with minimal external service dependencies, making it easy to deploy and maintain in production environments.