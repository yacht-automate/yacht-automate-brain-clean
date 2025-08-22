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
  type: z.string().optional(),
  guests: z.coerce.number().optional(),
  strictGuests: z.coerce.number().default(1),
  minLength: z.coerce.number().optional(),
  maxLength: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  limit: z.coerce.number().default(20)
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

export const CalculateQuoteRequestSchema = z.object({
  yachtId: z.string(),
  weeks: z.coerce.number().default(1),
  extras: z.coerce.number().default(0)
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

export interface MatchResult {
  yacht: Yacht;
  score: number;
}

export interface QuoteBreakdown {
  basePrice: number;
  apa: number;
  vat: number;
  extras: number;
  total: number;
  currency: string;
}

export interface EmailJob {
  tenantId: string;
  to: string;
  subject: string;
  body: string;
  leadId?: string;
}
