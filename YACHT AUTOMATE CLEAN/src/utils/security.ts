import { createHash, createHmac } from 'crypto';

export class SecurityUtils {
  // Hash PII for logs (irreversible)
  static hashPII(value: string): string {
    return createHash('sha256').update(value).digest('hex').substring(0, 12);
  }

  // Partially redact PII for logs
  static redactEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    
    const redactedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : '*'.repeat(local.length);
    
    return `${redactedLocal}@${domain}`;
  }

  static redactPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return '*'.repeat(cleaned.length);
    
    return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
  }

  // HMAC signature for webhooks
  static generateHmacSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  static verifyHmacSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateHmacSignature(payload, secret);
    return signature === expectedSignature;
  }

  // Sanitize log data
  static sanitizeLogData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveFields = ['email', 'phone', 'phoneNumber', 'password', 'token', 'key', 'secret'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        if (field === 'email') {
          sanitized[field] = this.redactEmail(sanitized[field]);
        } else if (field === 'phone' || field === 'phoneNumber') {
          sanitized[field] = this.redactPhone(sanitized[field]);
        } else {
          sanitized[field] = '***';
        }
      }
    }

    return sanitized;
  }
}