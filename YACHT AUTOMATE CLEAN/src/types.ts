import { z } from 'zod';

// Database schemas
export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  smtpHost: z.string().nullable().optional(),
  smtpPort: z.number().nullable().optional(),
  smtpUser: z.string().nullable().optional(),
  smtpPass: z.string().nullable().optional(),
  fromName: z.string().nullable().optional(),
  fromEmail: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const YachtSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  builder: z.string(),
  type: z.string(),
  length: z.number(),
  area: z.string(),
  cabins: z.number(),
  guests: z.number(),
  weeklyRate: z.number(),
  currency: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const LeadSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  notes: z.string(),
  partySize: z.number(),
  location: z.string().nullable().optional(),
  dates: z.string().nullable().optional(),
  budget: z.number().nullable().optional(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const QuoteSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  leadId: z.string().nullable().optional(),
  yachtId: z.string(),
  basePrice: z.number(),
  apa: z.number(),
  vat: z.number(),
  extras: z.number(),
  total: z.number(),
  currency: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const EventSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  type: z.string(),
  entityId: z.string().nullable().optional(),
  payload: z.string(),
  createdAt: z.string()
});

// API request/response schemas
export const CreateTenantRequestSchema = z.object({
  id: z.string(),
  name: z.string(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().optional()
});

export const SearchYachtsRequestSchema = z.object({
  area: z.string().optional(),
  q: z.string().optional(),
  type: z.string().optional(),
  guests: z.coerce.number().optional(),
  strictGuests: z.boolean().default(true),
  minLength: z.coerce.number().optional(),
  maxLength: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0)
});

export const CreateLeadRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  notes: z.string(),
  partySize: z.coerce.number(),
  location: z.string().optional(),
  dates: z.string().optional(),
  budget: z.coerce.number().optional()
});

// New schemas for production features
export const AuditLogSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string().optional(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  oldValues: z.string().optional(),
  newValues: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.string()
});

export const DeadLetterSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  type: z.enum(['email', 'webhook']),
  payload: z.string(),
  error: z.string(),
  attempts: z.number(),
  lastAttempt: z.string(),
  createdAt: z.string()
});

export const MailLogSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  leadId: z.string().optional(),
  toEmail: z.string(),
  cc: z.string().optional(),
  subject: z.string(),
  sent: z.boolean(),
  error: z.string().optional(),
  createdAt: z.string()
});

export const IdempotencyKeySchema = z.object({
  key: z.string(),
  tenantId: z.string(),
  resource: z.string(),
  resourceId: z.string(),
  response: z.string(),
  expiresAt: z.string(),
  createdAt: z.string()
});

export const MigrationSchema = z.object({
  version: z.number(),
  name: z.string(),
  executedAt: z.string()
});

export const CalculateQuoteRequestSchema = z.object({
  yachtId: z.string(),
  weeks: z.coerce.number().default(1),
  apaPct: z.coerce.number().default(25),
  vatPct: z.coerce.number().default(0),
  gratuityPct: z.coerce.number().default(0),
  deliveryFee: z.coerce.number().default(0),
  extras: z.array(z.object({
    label: z.string(),
    amount: z.coerce.number()
  })).default([])
});

export const IngestEmailRequestSchema = z.object({
  from: z.string().email(),
  subject: z.string(),
  body: z.string(),
  receivedAt: z.string().optional()
});

// Type exports
export type Tenant = z.infer<typeof TenantSchema>;
export type Yacht = z.infer<typeof YachtSchema>;
export type Lead = z.infer<typeof LeadSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type Event = z.infer<typeof EventSchema>;

export type CreateTenantRequest = z.infer<typeof CreateTenantRequestSchema>;
export type SearchYachtsRequest = z.infer<typeof SearchYachtsRequestSchema>;
export type CreateLeadRequest = z.infer<typeof CreateLeadRequestSchema>;
export type CalculateQuoteRequest = z.infer<typeof CalculateQuoteRequestSchema>;
export type IngestEmailRequest = z.infer<typeof IngestEmailRequestSchema>;

// New type exports
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type DeadLetter = z.infer<typeof DeadLetterSchema>;
export type MailLog = z.infer<typeof MailLogSchema>;
export type IdempotencyKey = z.infer<typeof IdempotencyKeySchema>;
export type Migration = z.infer<typeof MigrationSchema>;

export interface MatchResult {
  yacht: Yacht;
  score: number;
}

export interface QuoteBreakdown {
  currency: string;
  weeks: number;
  base: number;
  apaPct: number;
  apaAmount: number;
  vatPct: number;
  vatAmount: number;
  gratuityPct: number;
  gratuityAmount: number;
  deliveryFee: number;
  extrasTotal: number;
  total: number;
  breakdown: Array<{
    label: string;
    amount: number;
  }>;
}

export interface EmailJob {
  tenantId: string;
  leadId?: string | number; // Optional for system emails
  to: string;
  cc?: string; // CC the charter company
  subject: string;
  body: string;
}
