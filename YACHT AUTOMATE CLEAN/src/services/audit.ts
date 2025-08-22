import { randomUUID } from 'crypto';
import { DatabaseService } from '../db';
import { AuditLog } from '../types';

export class AuditService {
  constructor(private db: DatabaseService) {}

  logAction(params: {
    tenantId: string;
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }): AuditLog {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db['db'].prepare(`
      INSERT INTO audit_logs 
      (id, tenantId, userId, action, resource, resourceId, oldValues, newValues, ipAddress, userAgent, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      params.tenantId,
      params.userId || null,
      params.action,
      params.resource,
      params.resourceId || null,
      params.oldValues ? JSON.stringify(params.oldValues) : null,
      params.newValues ? JSON.stringify(params.newValues) : null,
      params.ipAddress || null,
      params.userAgent || null,
      now
    );

    return {
      id,
      tenantId: params.tenantId,
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      oldValues: params.oldValues ? JSON.stringify(params.oldValues) : undefined,
      newValues: params.newValues ? JSON.stringify(params.newValues) : undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: now
    };
  }

  getAuditLogs(tenantId: string, limit: number = 100, offset: number = 0): AuditLog[] {
    const stmt = this.db['db'].prepare(`
      SELECT * FROM audit_logs 
      WHERE tenantId = ? 
      ORDER BY createdAt DESC 
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(tenantId, limit, offset) as any[];
    return rows.map(row => ({
      id: row.id,
      tenantId: row.tenantId,
      userId: row.userId,
      action: row.action,
      resource: row.resource,
      resourceId: row.resourceId,
      oldValues: row.oldValues,
      newValues: row.newValues,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.createdAt
    }));
  }

  // Clean old audit logs based on retention policy
  cleanOldLogs(retentionDays: number = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const stmt = this.db['db'].prepare(`
      DELETE FROM audit_logs 
      WHERE createdAt < ?
    `);
    
    const result = stmt.run(cutoffDate.toISOString());
    return result.changes;
  }
}