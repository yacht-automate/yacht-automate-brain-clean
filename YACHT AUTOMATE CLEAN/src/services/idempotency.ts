import { randomUUID } from 'crypto';
import { DatabaseService } from '../db';

export class IdempotencyService {
  constructor(private db: DatabaseService) {}

  async checkAndStore(
    key: string,
    tenantId: string,
    resource: string,
    resourceId: string,
    response: any,
    ttlHours: number = 24
  ): Promise<{ isNew: boolean; response?: any }> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    // Check if key exists and not expired
    const existingStmt = this.db['db'].prepare(`
      SELECT response FROM idempotency_keys 
      WHERE key = ? AND tenantId = ? AND expiresAt > ?
    `);
    
    const existing = existingStmt.get(key, tenantId, new Date().toISOString()) as any;
    
    if (existing) {
      return {
        isNew: false,
        response: JSON.parse(existing.response)
      };
    }

    // Store new key
    const stmt = this.db['db'].prepare(`
      INSERT OR REPLACE INTO idempotency_keys 
      (key, tenantId, resource, resourceId, response, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      key,
      tenantId,
      resource,
      resourceId,
      JSON.stringify(response),
      expiresAt.toISOString()
    );

    return { isNew: true };
  }

  cleanExpiredKeys() {
    const stmt = this.db['db'].prepare(`
      DELETE FROM idempotency_keys 
      WHERE expiresAt < ?
    `);
    
    const result = stmt.run(new Date().toISOString());
    return result.changes;
  }
}