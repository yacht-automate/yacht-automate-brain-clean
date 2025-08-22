import { randomUUID } from 'crypto';
import { DatabaseService } from '../db';
import { DeadLetter } from '../types';

export class DeadLetterService {
  constructor(private db: DatabaseService) {}

  store(params: {
    tenantId: string;
    type: 'email' | 'webhook';
    payload: any;
    error: string;
    attempts: number;
  }): DeadLetter {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db['db'].prepare(`
      INSERT INTO dead_letters 
      (id, tenantId, type, payload, error, attempts, lastAttempt, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      params.tenantId,
      params.type,
      JSON.stringify(params.payload),
      params.error,
      params.attempts,
      now,
      now
    );

    return {
      id,
      tenantId: params.tenantId,
      type: params.type,
      payload: JSON.stringify(params.payload),
      error: params.error,
      attempts: params.attempts,
      lastAttempt: now,
      createdAt: now
    };
  }

  getDeadLetters(tenantId: string, limit: number = 50): DeadLetter[] {
    const stmt = this.db['db'].prepare(`
      SELECT * FROM dead_letters 
      WHERE tenantId = ? 
      ORDER BY createdAt DESC 
      LIMIT ?
    `);
    
    const rows = stmt.all(tenantId, limit) as any[];
    return rows.map(row => ({
      id: row.id,
      tenantId: row.tenantId,
      type: row.type,
      payload: row.payload,
      error: row.error,
      attempts: row.attempts,
      lastAttempt: row.lastAttempt,
      createdAt: row.createdAt
    }));
  }

  cleanOldDeadLetters(retentionDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const stmt = this.db['db'].prepare(`
      DELETE FROM dead_letters 
      WHERE createdAt < ?
    `);
    
    const result = stmt.run(cutoffDate.toISOString());
    return result.changes;
  }
}