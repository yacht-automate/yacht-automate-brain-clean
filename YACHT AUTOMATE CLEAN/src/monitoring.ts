import nodemailer from 'nodemailer';

export class MonitoringService {
  private static instance: MonitoringService;
  private lastHealthCheck = Date.now();
  private errorCount = 0;
  private readonly maxErrors = 10;
  private readonly healthCheckInterval = 30000; // 30 seconds

  private constructor() {
    this.startHealthCheck();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private startHealthCheck() {
    setInterval(() => {
      this.lastHealthCheck = Date.now();
      
      // Reset error count if system is stable
      if (this.errorCount > 0) {
        this.errorCount = Math.max(0, this.errorCount - 1);
      }
    }, this.healthCheckInterval);
  }

  public logError(error: Error, context: string) {
    this.errorCount++;
    
    console.error(`[MONITORING] Error in ${context}:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      errorCount: this.errorCount
    });

    // Send alert if too many errors
    if (this.errorCount >= this.maxErrors) {
      this.sendAlert(`High error rate detected: ${this.errorCount} errors in system`);
    }
  }

  public async sendAlert(message: string) {
    try {
      // Try to send email alert if SMTP is configured
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: 587,
          secure: false,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        await transporter.sendMail({
          from: `"Yacht Automate Alert" <${smtpUser}>`,
          to: process.env.ALERT_EMAIL || smtpUser,
          subject: '🚨 Yacht Automate System Alert',
          html: `
            <h2>System Alert</h2>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>Server:</strong> ${process.env.REPL_SLUG || 'Unknown'}</p>
          `
        });
      }

      // Always log to console
      console.error(`[ALERT] ${message} - ${new Date().toISOString()}`);
    } catch (error) {
      console.error('[MONITORING] Failed to send alert:', error);
    }
  }

  public getHealthStatus() {
    const now = Date.now();
    const isHealthy = (now - this.lastHealthCheck) < (this.healthCheckInterval * 2);
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      uptime: process.uptime(),
      errorCount: this.errorCount,
      lastHealthCheck: new Date(this.lastHealthCheck).toISOString(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

// Global error handlers
process.on('uncaughtException', (error) => {
  MonitoringService.getInstance().logError(error, 'uncaughtException');
  MonitoringService.getInstance().sendAlert(`Uncaught exception: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  MonitoringService.getInstance().logError(error, 'unhandledRejection');
  MonitoringService.getInstance().sendAlert(`Unhandled rejection: ${error.message}`);
});

export const monitoring = MonitoringService.getInstance();