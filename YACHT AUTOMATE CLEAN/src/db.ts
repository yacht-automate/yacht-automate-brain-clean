import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { 
  Tenant, Yacht, Lead, Quote, Event,
  TenantSchema, YachtSchema, LeadSchema, QuoteSchema, EventSchema
} from './types';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string = 'db/data.sqlite') {
    // Ensure db directory exists
    const fs = require('fs');
    const path = require('path');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initTables();
  }

  private initTables() {
    
    // Tenants table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        smtpHost TEXT,
        smtpPort INTEGER,
        smtpUser TEXT,
        smtpPass TEXT,
        fromName TEXT,
        fromEmail TEXT,
        proposalCc TEXT,
        webhookUrl TEXT,
        webhookSecret TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Yachts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS yachts (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        name TEXT NOT NULL,
        builder TEXT NOT NULL,
        type TEXT NOT NULL,
        length INTEGER NOT NULL,
        area TEXT NOT NULL,
        cabins INTEGER NOT NULL,
        guests INTEGER NOT NULL,
        weeklyRate INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenantId) REFERENCES tenants(id)
      )
    `);

    // Leads table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        notes TEXT NOT NULL,
        partySize INTEGER NOT NULL,
        location TEXT,
        dates TEXT,
        budget INTEGER,
        status TEXT NOT NULL DEFAULT 'new',
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenantId) REFERENCES tenants(id)
      )
    `);

    // Quotes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        leadId TEXT,
        yachtId TEXT NOT NULL,
        basePrice INTEGER NOT NULL,
        apa INTEGER NOT NULL,
        vat INTEGER NOT NULL,
        extras INTEGER NOT NULL DEFAULT 0,
        total INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenantId) REFERENCES tenants(id),
        FOREIGN KEY (leadId) REFERENCES leads(id),
        FOREIGN KEY (yachtId) REFERENCES yachts(id)
      )
    `);

    // Events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        type TEXT NOT NULL,
        entityId TEXT,
        payload TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenantId) REFERENCES tenants(id)
      )
    `);

    // Audit log table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        userId TEXT,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resourceId TEXT,
        oldValues TEXT,
        newValues TEXT,
        ipAddress TEXT,
        userAgent TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenantId) REFERENCES tenants(id)
      )
    `);

    // Dead letter table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dead_letters (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('email', 'webhook')),
        payload TEXT NOT NULL,
        error TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 1,
        lastAttempt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenantId) REFERENCES tenants(id)
      )
    `);

    // Mail log table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mail_logs (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        leadId TEXT,
        toEmail TEXT NOT NULL,
        cc TEXT,
        subject TEXT NOT NULL,
        sent INTEGER NOT NULL DEFAULT 0,
        error TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenantId) REFERENCES tenants(id),
        FOREIGN KEY (leadId) REFERENCES leads(id)
      )
    `);

    // Idempotency keys table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key TEXT NOT NULL,
        tenantId TEXT NOT NULL,
        resource TEXT NOT NULL,
        resourceId TEXT NOT NULL,
        response TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (key, tenantId),
        FOREIGN KEY (tenantId) REFERENCES tenants(id)
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_yachts_tenant_area ON yachts(tenantId, area);
      CREATE INDEX IF NOT EXISTS idx_yachts_guests ON yachts(guests);
      CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenantId);
      CREATE INDEX IF NOT EXISTS idx_events_tenant_type ON events(tenantId, type);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenantId, createdAt);
      CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expiresAt);
    `);
  }

  // Tenant operations
  createOrUpdateTenant(tenant: Omit<Tenant, 'createdAt' | 'updatedAt'>): Tenant {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tenants 
      (id, name, smtpHost, smtpPort, smtpUser, smtpPass, fromName, fromEmail, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      tenant.id,
      tenant.name,
      tenant.smtpHost || null,
      tenant.smtpPort || null,
      tenant.smtpUser || null,
      tenant.smtpPass || null,
      tenant.fromName || null,
      tenant.fromEmail || null,
      now,
      now
    );

    return this.getTenant(tenant.id)!;
  }

  getTenant(id: string): Tenant | null {
    const stmt = this.db.prepare('SELECT * FROM tenants WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? TenantSchema.parse(row) : null;
  }

  // Yacht operations
  createYacht(yacht: Omit<Yacht, 'id' | 'createdAt' | 'updatedAt'>): Yacht {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO yachts 
      (id, tenantId, name, builder, type, length, area, cabins, guests, weeklyRate, currency, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      yacht.tenantId,
      yacht.name,
      yacht.builder,
      yacht.type,
      yacht.length,
      yacht.area,
      yacht.cabins,
      yacht.guests,
      yacht.weeklyRate,
      yacht.currency,
      now,
      now
    );

    return this.getYacht(id)!;
  }

  getYacht(id: string): Yacht | null {
    const stmt = this.db.prepare('SELECT * FROM yachts WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? YachtSchema.parse(row) : null;
  }

  searchYachts(tenantId: string, filters: {
    area?: string;
    q?: string;
    type?: string;
    guests?: number;
    strictGuests?: boolean;
    minLength?: number;
    maxLength?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  } = {}): { items: Yacht[], total: number } {
    // Build count query first
    let countQuery = 'SELECT COUNT(*) as total FROM yachts WHERE tenantId = ?';
    let query = 'SELECT * FROM yachts WHERE tenantId = ?';
    const params: any[] = [tenantId];
    const countParams: any[] = [tenantId];

    // Apply filters
    if (filters.area) {
      const condition = ' AND LOWER(area) = LOWER(?)';
      query += condition;
      countQuery += condition;
      params.push(filters.area);
      countParams.push(filters.area);
    }

    if (filters.q) {
      const condition = ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(builder) LIKE LOWER(?) OR LOWER(type) LIKE LOWER(?))';
      const searchTerm = `%${filters.q}%`;
      query += condition;
      countQuery += condition;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.type) {
      const condition = ' AND LOWER(type) = LOWER(?)';
      query += condition;
      countQuery += condition;
      params.push(filters.type);
      countParams.push(filters.type);
    }

    if (filters.guests && filters.strictGuests) {
      // strictGuests=true: include yachts with y.guests >= guests AND (y.guests - guests) <= 2
      const condition = ' AND guests >= ? AND (guests - ?) <= 2';
      query += condition;
      countQuery += condition;
      params.push(filters.guests, filters.guests);
      countParams.push(filters.guests, filters.guests);
    } else if (filters.guests) {
      const condition = ' AND guests >= ?';
      query += condition;
      countQuery += condition;
      params.push(filters.guests);
      countParams.push(filters.guests);
    }

    if (filters.minLength) {
      const condition = ' AND length >= ?';
      query += condition;
      countQuery += condition;
      params.push(filters.minLength);
      countParams.push(filters.minLength);
    }

    if (filters.maxLength) {
      const condition = ' AND length <= ?';
      query += condition;
      countQuery += condition;
      params.push(filters.maxLength);
      countParams.push(filters.maxLength);
    }

    if (filters.maxPrice) {
      const condition = ' AND weeklyRate <= ?';
      query += condition;
      countQuery += condition;
      params.push(filters.maxPrice);
      countParams.push(filters.maxPrice);
    }

    // Get total count
    const countStmt = this.db.prepare(countQuery);
    const totalResult = countStmt.get(...countParams) as any;
    const total = totalResult.total;

    // Apply ordering and pagination
    query += ' ORDER BY weeklyRate ASC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    const items = rows.map(row => YachtSchema.parse(row));

    return { items, total };
  }

  // Lead operations
  createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Lead {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO leads 
      (id, tenantId, email, name, notes, partySize, location, dates, budget, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      lead.tenantId,
      lead.email,
      lead.name || null,
      lead.notes,
      lead.partySize,
      lead.location || null,
      lead.dates || null,
      lead.budget || null,
      lead.status || 'new',
      now,
      now
    );

    return this.getLead(id)!;
  }

  getLead(id: string): Lead | null {
    const stmt = this.db.prepare('SELECT * FROM leads WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? LeadSchema.parse(row) : null;
  }

  // Quote operations
  createQuote(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Quote {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO quotes 
      (id, tenantId, leadId, yachtId, basePrice, apa, vat, extras, total, currency, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      quote.tenantId,
      quote.leadId || null,
      quote.yachtId,
      quote.basePrice,
      quote.apa,
      quote.vat,
      quote.extras,
      quote.total,
      quote.currency,
      now,
      now
    );

    return this.getQuote(id)!;
  }

  getQuote(id: string): Quote | null {
    const stmt = this.db.prepare('SELECT * FROM quotes WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? QuoteSchema.parse(row) : null;
  }

  // Event operations
  logEvent(event: Omit<Event, 'id' | 'createdAt'>): Event {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO events (id, tenantId, type, entityId, payload, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      event.tenantId,
      event.type,
      event.entityId || null,
      event.payload,
      now
    );

    const getStmt = this.db.prepare('SELECT * FROM events WHERE id = ?');
    const row = getStmt.get(id) as any;
    return EventSchema.parse(row);
  }

  close() {
    this.db.close();
  }
}
