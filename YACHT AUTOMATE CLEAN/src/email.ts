import nodemailer from 'nodemailer';
import { DatabaseService } from './db';
import { EmailJob, Yacht, QuoteBreakdown } from './types';
import { QuoteCalculator } from './quote';

export class EmailService {
  private quoteCalc = new QuoteCalculator();

  constructor(private db: DatabaseService, private logger: any) {}

  async sendEmail(job: EmailJob): Promise<boolean> {
    try {
      const tenant = this.db.getTenant(job.tenantId);
      if (!tenant) {
        this.logger.error({ tenantId: job.tenantId }, 'Tenant not found for email job');
        return false;
      }

      // Log the event
      this.db.logEvent({
        tenantId: job.tenantId,
        type: 'email_attempt',
        entityId: job.leadId?.toString() || null,
        payload: JSON.stringify({
          to: job.to,
          subject: job.subject,
          hasSmtp: !!(tenant.smtpHost && tenant.smtpUser)
        })
      });

      // Try global SMTP first, then tenant-specific
      const smtpConfig = this.getSmtpConfig(tenant);
      
      if (!smtpConfig.host || !smtpConfig.user) {
        this.logger.info(
          { tenantId: job.tenantId, to: job.to },
          'No SMTP configured - logging email to console'
        );
        this.logEmailToConsole(job, smtpConfig.fromName);
        return true;
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port || 587,
        secure: smtpConfig.port === 465,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        }
      });

      // Send email
      const info = await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
        to: job.to,
        cc: job.cc,
        subject: job.subject,
        html: job.body
      });

      this.logger.info(
        { tenantId: job.tenantId, messageId: info.messageId },
        'Email sent successfully'
      );

      this.db.logEvent({
        tenantId: job.tenantId,
        type: 'email_sent',
        entityId: job.leadId?.toString() || null,
        payload: JSON.stringify({
          to: job.to,
          messageId: info.messageId,
          subject: job.subject
        })
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        { tenantId: job.tenantId, error: errorMessage },
        'Failed to send email'
      );

      this.db.logEvent({
        tenantId: job.tenantId,
        type: 'email_failed',
        entityId: job.leadId?.toString() || null,
        payload: JSON.stringify({
          to: job.to,
          error: errorMessage,
          subject: job.subject
        })
      });

      return false;
    }
  }

  private logEmailToConsole(job: EmailJob, fromName: string) {
    console.log('\n' + '='.repeat(80));
    console.log('📧 EMAIL WOULD BE SENT (No SMTP configured)');
    console.log('='.repeat(80));
    console.log(`From: ${fromName}`);
    console.log(`To: ${job.to}`);
    console.log(`Subject: ${job.subject}`);
    console.log('─'.repeat(80));
    console.log(job.body);
    console.log('='.repeat(80) + '\n');
  }

  createLeadReplyEmail(
    leadEmail: string,
    leadName: string | undefined,
    area: string,
    guests: number,
    yachts: Yacht[]
  ): EmailJob {
    const subject = `Your charter options — ${area} — ${guests} guests`;
    
    // Take top 2-4 yachts for email
    const selectedYachts = yachts.slice(0, Math.min(4, yachts.length));
    
    const body = this.generateEmailBody(leadName, area, guests, selectedYachts);

    return {
      tenantId: yachts[0]?.tenantId || '',
      to: leadEmail,
      subject,
      body
    };
  }

  private generateEmailBody(
    leadName: string | undefined,
    area: string,
    guests: number,
    yachts: Yacht[]
  ): string {
    const greeting = leadName ? `Dear ${leadName}` : 'Dear Charter Guest';
    
    let yachtOptions = '';
    yachts.forEach((yacht, index) => {
      const quote = this.quoteCalc.calculateQuote(yacht);
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: yacht.currency,
        minimumFractionDigits: 0
      });

      yachtOptions += `
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 15px 0; background: #f9f9f9;">
          <h3 style="margin: 0 0 10px 0; color: #2c5aa0;">${yacht.name}</h3>
          <p style="margin: 5px 0; color: #666;">
            <strong>Builder:</strong> ${yacht.builder} | 
            <strong>Length:</strong> ${yacht.length}m | 
            <strong>Guests:</strong> ${yacht.guests} | 
            <strong>Cabins:</strong> ${yacht.cabins}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Type:</strong> ${yacht.type} | 
            <strong>Area:</strong> ${yacht.area}
          </p>
          <p style="margin: 10px 0; font-size: 18px; color: #2c5aa0;">
            <strong>Weekly Charter: ${formatter.format(quote.total)}</strong>
          </p>
          <p style="margin: 5px 0; font-size: 12px; color: #888;">
            Includes base rate ${formatter.format(quote.base)}, APA ${formatter.format(quote.apaAmount)}, and VAT ${formatter.format(quote.vatAmount)}
          </p>
        </div>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Charter Options</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px;">Your Charter Options</h1>
        
        <p>${greeting},</p>
        
        <p>Thank you for your interest in chartering a yacht in the <strong>${area}</strong> for <strong>${guests} guests</strong>.</p>
        
        <p>Based on your requirements, we've selected the following yachts that would be perfect for your charter:</p>
        
        ${yachtOptions}
        
        <div style="background: #e8f4f8; border-left: 4px solid #2c5aa0; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #2c5aa0;">Next Steps</h3>
          <p style="margin: 5px 0;">Our charter specialists are standing by to help you finalize your perfect yacht charter.</p>
          <p style="margin: 5px 0;"><strong>📞 Call us:</strong> +1-555-YACHT-01</p>
          <p style="margin: 5px 0;"><strong>✉️ Email us:</strong> charters@yachtautomate.com</p>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
          <strong>Important:</strong> All prices are indicative and subject to availability. APA (Advance Provisioning Allowance) covers fuel, food, beverages, and port fees. VAT rates may vary by jurisdiction.
        </p>
        
        <p style="font-size: 12px; color: #666;">
          Best regards,<br>
          The Yacht Automate Team
        </p>
      </body>
      </html>
    `;
  }

  private getSmtpConfig(tenant: any) {
    // Use environment variables as fallback if tenant SMTP not configured
    return {
      host: tenant.smtpHost || process.env.SMTP_HOST,
      port: tenant.smtpPort || parseInt(process.env.SMTP_PORT || '587'),
      user: tenant.smtpUser || process.env.SMTP_USER,
      pass: tenant.smtpPass || process.env.SMTP_PASS,
      fromName: tenant.fromName || process.env.FROM_NAME || 'Yacht Charter Automation',
      fromEmail: tenant.fromEmail || process.env.FROM_EMAIL || process.env.SMTP_USER
    };
  }
}
