import { DatabaseService } from '../db';

export interface DashboardMetrics {
  // Lead metrics
  totalLeads: number;
  leadsToday: number;
  leadsThisWeek: number;
  leadsThisMonth: number;
  leadsByStatus: { status: string; count: number }[];
  
  // Quote metrics
  totalQuotes: number;
  quotesToday: number;
  averageQuoteValue: number;
  totalQuoteValue: number;
  quoteConversionRate: number;
  
  // Yacht metrics
  totalYachts: number;
  yachtsByArea: { area: string; count: number }[];
  yachtsByType: { type: string; count: number }[];
  popularYachts: { id: string; name: string; views: number }[];
  
  // Performance metrics
  averageResponseTime: number;
  emailsSent: number;
  emailsDelivered: number;
  systemUptime: number;
  
  // Revenue metrics
  totalRevenue: number;
  revenueByArea: { area: string; revenue: number }[];
  averageCharterValue: number;
  topPerformingYachts: { id: string; name: string; revenue: number; bookings: number }[];
  
  // Time-based analytics
  leadsByDay: { date: string; count: number }[];
  quotesByDay: { date: string; count: number; value: number }[];
  conversionTrend: { date: string; rate: number }[];
  
  // Geographic analytics
  leadsByLocation: { location: string; count: number }[];
  revenueByLocation: { location: string; revenue: number }[];
  
  // Customer analytics
  averagePartySize: number;
  partySizeDistribution: { size: number; count: number }[];
  repeatCustomers: number;
  customerLifetimeValue: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export class DashboardService {
  constructor(private db: DatabaseService) {}

  async getDashboardMetrics(tenantId: string, dateRange?: DateRange): Promise<DashboardMetrics> {
    const { startDate, endDate } = this.getDateRange(dateRange);
    
    const [
      leadMetrics,
      quoteMetrics,
      yachtMetrics,
      performanceMetrics,
      revenueMetrics,
      timeAnalytics,
      geoAnalytics,
      customerAnalytics
    ] = await Promise.all([
      this.getLeadMetrics(tenantId, startDate, endDate),
      this.getQuoteMetrics(tenantId, startDate, endDate),
      this.getYachtMetrics(tenantId),
      this.getPerformanceMetrics(tenantId),
      this.getRevenueMetrics(tenantId, startDate, endDate),
      this.getTimeAnalytics(tenantId, startDate, endDate),
      this.getGeographicAnalytics(tenantId, startDate, endDate),
      this.getCustomerAnalytics(tenantId, startDate, endDate)
    ]);

    return {
      ...leadMetrics,
      ...quoteMetrics,
      ...yachtMetrics,
      ...performanceMetrics,
      ...revenueMetrics,
      ...timeAnalytics,
      ...geoAnalytics,
      ...customerAnalytics
    };
  }

  private getDateRange(dateRange?: DateRange): { startDate: string; endDate: string } {
    const endDate = dateRange?.endDate || new Date().toISOString();
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 30); // Default to 30 days
    const startDate = dateRange?.startDate || defaultStart.toISOString();
    
    return { startDate, endDate };
  }

  private async getLeadMetrics(tenantId: string, startDate: string, endDate: string) {
    const db = this.db['db'];
    
    // Total leads
    const totalLeadsResult = db.prepare(`
      SELECT COUNT(*) as count FROM leads WHERE tenantId = ?
    `).get(tenantId) as any;
    
    // Leads in date range
    const leadsInRangeResult = db.prepare(`
      SELECT COUNT(*) as count FROM leads 
      WHERE tenantId = ? AND createdAt BETWEEN ? AND ?
    `).get(tenantId, startDate, endDate) as any;
    
    // Leads today
    const today = new Date().toISOString().split('T')[0];
    const leadsTodayResult = db.prepare(`
      SELECT COUNT(*) as count FROM leads 
      WHERE tenantId = ? AND DATE(createdAt) = ?
    `).get(tenantId, today) as any;
    
    // Leads this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const leadsThisWeekResult = db.prepare(`
      SELECT COUNT(*) as count FROM leads 
      WHERE tenantId = ? AND createdAt >= ?
    `).get(tenantId, weekAgo.toISOString()) as any;
    
    // Leads this month
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const leadsThisMonthResult = db.prepare(`
      SELECT COUNT(*) as count FROM leads 
      WHERE tenantId = ? AND createdAt >= ?
    `).get(tenantId, monthAgo.toISOString()) as any;
    
    // Leads by status
    const leadsByStatusResult = db.prepare(`
      SELECT status, COUNT(*) as count FROM leads 
      WHERE tenantId = ? AND createdAt BETWEEN ? AND ?
      GROUP BY status
    `).all(tenantId, startDate, endDate) as any[];

    return {
      totalLeads: totalLeadsResult.count,
      leadsToday: leadsTodayResult.count,
      leadsThisWeek: leadsThisWeekResult.count,
      leadsThisMonth: leadsThisMonthResult.count,
      leadsByStatus: leadsByStatusResult
    };
  }

  private async getQuoteMetrics(tenantId: string, startDate: string, endDate: string) {
    const db = this.db['db'];
    
    // Total quotes
    const totalQuotesResult = db.prepare(`
      SELECT COUNT(*) as count, AVG(total) as avgValue, SUM(total) as totalValue 
      FROM quotes WHERE tenantId = ?
    `).get(tenantId) as any;
    
    // Quotes today
    const today = new Date().toISOString().split('T')[0];
    const quotesTodayResult = db.prepare(`
      SELECT COUNT(*) as count FROM quotes 
      WHERE tenantId = ? AND DATE(createdAt) = ?
    `).get(tenantId, today) as any;
    
    // Quote conversion rate (quotes with leads vs total leads)
    const conversionResult = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM quotes WHERE tenantId = ? AND leadId IS NOT NULL) as quotesWithLeads,
        (SELECT COUNT(*) FROM leads WHERE tenantId = ?) as totalLeads
    `).get(tenantId, tenantId) as any;
    
    const conversionRate = conversionResult.totalLeads > 0 
      ? (conversionResult.quotesWithLeads / conversionResult.totalLeads) * 100 
      : 0;

    return {
      totalQuotes: totalQuotesResult.count,
      quotesToday: quotesTodayResult.count,
      averageQuoteValue: Math.round(totalQuotesResult.avgValue || 0),
      totalQuoteValue: totalQuotesResult.totalValue || 0,
      quoteConversionRate: Math.round(conversionRate * 100) / 100
    };
  }

  private async getYachtMetrics(tenantId: string) {
    const db = this.db['db'];
    
    // Total yachts
    const totalYachtsResult = db.prepare(`
      SELECT COUNT(*) as count FROM yachts WHERE tenantId = ?
    `).get(tenantId) as any;
    
    // Yachts by area
    const yachtsByAreaResult = db.prepare(`
      SELECT area, COUNT(*) as count FROM yachts 
      WHERE tenantId = ? GROUP BY area ORDER BY count DESC
    `).all(tenantId) as any[];
    
    // Yachts by type
    const yachtsByTypeResult = db.prepare(`
      SELECT type, COUNT(*) as count FROM yachts 
      WHERE tenantId = ? GROUP BY type ORDER BY count DESC
    `).all(tenantId) as any[];
    
    // Popular yachts (based on quote requests)
    const popularYachtsResult = db.prepare(`
      SELECT y.id, y.name, COUNT(q.id) as views 
      FROM yachts y LEFT JOIN quotes q ON y.id = q.yachtId 
      WHERE y.tenantId = ? 
      GROUP BY y.id, y.name 
      ORDER BY views DESC 
      LIMIT 10
    `).all(tenantId) as any[];

    return {
      totalYachts: totalYachtsResult.count,
      yachtsByArea: yachtsByAreaResult,
      yachtsByType: yachtsByTypeResult,
      popularYachts: popularYachtsResult
    };
  }

  private async getPerformanceMetrics(tenantId: string) {
    // These would typically come from monitoring systems
    // For now, return basic metrics
    return {
      averageResponseTime: 250, // milliseconds
      emailsSent: 0, // Would track from email service
      emailsDelivered: 0, // Would track from email service
      systemUptime: 99.9 // percentage
    };
  }

  private async getRevenueMetrics(tenantId: string, startDate: string, endDate: string) {
    const db = this.db['db'];
    
    // Total revenue (sum of all quotes in date range)
    const revenueResult = db.prepare(`
      SELECT SUM(total) as totalRevenue, AVG(total) as avgValue
      FROM quotes 
      WHERE tenantId = ? AND createdAt BETWEEN ? AND ?
    `).get(tenantId, startDate, endDate) as any;
    
    // Revenue by area
    const revenueByAreaResult = db.prepare(`
      SELECT y.area, SUM(q.total) as revenue
      FROM quotes q 
      JOIN yachts y ON q.yachtId = y.id
      WHERE q.tenantId = ? AND q.createdAt BETWEEN ? AND ?
      GROUP BY y.area
      ORDER BY revenue DESC
    `).all(tenantId, startDate, endDate) as any[];
    
    // Top performing yachts
    const topYachtsResult = db.prepare(`
      SELECT y.id, y.name, SUM(q.total) as revenue, COUNT(q.id) as bookings
      FROM quotes q 
      JOIN yachts y ON q.yachtId = y.id
      WHERE q.tenantId = ? AND q.createdAt BETWEEN ? AND ?
      GROUP BY y.id, y.name
      ORDER BY revenue DESC
      LIMIT 10
    `).all(tenantId, startDate, endDate) as any[];

    return {
      totalRevenue: revenueResult.totalRevenue || 0,
      revenueByArea: revenueByAreaResult,
      averageCharterValue: Math.round(revenueResult.avgValue || 0),
      topPerformingYachts: topYachtsResult
    };
  }

  private async getTimeAnalytics(tenantId: string, startDate: string, endDate: string) {
    const db = this.db['db'];
    
    // Leads by day
    const leadsByDayResult = db.prepare(`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM leads 
      WHERE tenantId = ? AND createdAt BETWEEN ? AND ?
      GROUP BY DATE(createdAt)
      ORDER BY date
    `).all(tenantId, startDate, endDate) as any[];
    
    // Quotes by day
    const quotesByDayResult = db.prepare(`
      SELECT DATE(createdAt) as date, COUNT(*) as count, SUM(total) as value
      FROM quotes 
      WHERE tenantId = ? AND createdAt BETWEEN ? AND ?
      GROUP BY DATE(createdAt)
      ORDER BY date
    `).all(tenantId, startDate, endDate) as any[];
    
    // Conversion trend (simplified - quotes/leads ratio by day)
    const conversionTrendResult = db.prepare(`
      SELECT 
        DATE(l.createdAt) as date,
        COUNT(l.id) as leads,
        (SELECT COUNT(*) FROM quotes q WHERE DATE(q.createdAt) = DATE(l.createdAt) AND q.tenantId = ?) as quotes
      FROM leads l
      WHERE l.tenantId = ? AND l.createdAt BETWEEN ? AND ?
      GROUP BY DATE(l.createdAt)
      ORDER BY date
    `).all(tenantId, tenantId, startDate, endDate) as any[];
    
    const conversionTrend = conversionTrendResult.map(row => ({
      date: row.date,
      rate: row.leads > 0 ? Math.round((row.quotes / row.leads) * 10000) / 100 : 0
    }));

    return {
      leadsByDay: leadsByDayResult,
      quotesByDay: quotesByDayResult,
      conversionTrend
    };
  }

  private async getGeographicAnalytics(tenantId: string, startDate: string, endDate: string) {
    const db = this.db['db'];
    
    // Leads by location
    const leadsByLocationResult = db.prepare(`
      SELECT location, COUNT(*) as count
      FROM leads 
      WHERE tenantId = ? AND location IS NOT NULL AND createdAt BETWEEN ? AND ?
      GROUP BY location
      ORDER BY count DESC
    `).all(tenantId, startDate, endDate) as any[];
    
    // Revenue by location (using yacht area as proxy)
    const revenueByLocationResult = db.prepare(`
      SELECT y.area as location, SUM(q.total) as revenue
      FROM quotes q 
      JOIN yachts y ON q.yachtId = y.id
      WHERE q.tenantId = ? AND q.createdAt BETWEEN ? AND ?
      GROUP BY y.area
      ORDER BY revenue DESC
    `).all(tenantId, startDate, endDate) as any[];

    return {
      leadsByLocation: leadsByLocationResult,
      revenueByLocation: revenueByLocationResult
    };
  }

  private async getCustomerAnalytics(tenantId: string, startDate: string, endDate: string) {
    const db = this.db['db'];
    
    // Average party size
    const avgPartySizeResult = db.prepare(`
      SELECT AVG(partySize) as avgSize
      FROM leads 
      WHERE tenantId = ? AND createdAt BETWEEN ? AND ?
    `).get(tenantId, startDate, endDate) as any;
    
    // Party size distribution
    const partySizeDistResult = db.prepare(`
      SELECT partySize as size, COUNT(*) as count
      FROM leads 
      WHERE tenantId = ? AND createdAt BETWEEN ? AND ?
      GROUP BY partySize
      ORDER BY size
    `).all(tenantId, startDate, endDate) as any[];
    
    // Repeat customers (simplified - count emails that appear more than once)
    const repeatCustomersResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM (
        SELECT email, COUNT(*) as leadCount
        FROM leads 
        WHERE tenantId = ? AND createdAt BETWEEN ? AND ?
        GROUP BY email
        HAVING leadCount > 1
      ) repeats
    `).get(tenantId, startDate, endDate) as any;
    
    // Customer lifetime value (average quote value per customer)
    const clvResult = db.prepare(`
      SELECT AVG(customer_total) as clv
      FROM (
        SELECT l.email, SUM(q.total) as customer_total
        FROM leads l
        LEFT JOIN quotes q ON l.id = q.leadId
        WHERE l.tenantId = ? AND l.createdAt BETWEEN ? AND ?
        GROUP BY l.email
      ) customer_values
    `).get(tenantId, startDate, endDate) as any;

    return {
      averagePartySize: Math.round((avgPartySizeResult.avgSize || 0) * 10) / 10,
      partySizeDistribution: partySizeDistResult,
      repeatCustomers: repeatCustomersResult.count,
      customerLifetimeValue: Math.round(clvResult.clv || 0)
    };
  }

  // Get real-time metrics for live dashboard updates
  async getLiveMetrics(tenantId: string) {
    const db = this.db['db'];
    
    const today = new Date().toISOString().split('T')[0];
    const thisHour = new Date().toISOString().substring(0, 13);
    
    // Recent activity (last hour)
    const recentActivity = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM leads WHERE tenantId = ? AND createdAt >= ?) as recentLeads,
        (SELECT COUNT(*) FROM quotes WHERE tenantId = ? AND createdAt >= ?) as recentQuotes
    `).get(tenantId, thisHour + ':00:00', tenantId, thisHour + ':00:00') as any;
    
    // Today's summary
    const todaySummary = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM leads WHERE tenantId = ? AND DATE(createdAt) = ?) as leadsToday,
        (SELECT COUNT(*) FROM quotes WHERE tenantId = ? AND DATE(createdAt) = ?) as quotesToday,
        (SELECT SUM(total) FROM quotes WHERE tenantId = ? AND DATE(createdAt) = ?) as revenueToday
    `).get(tenantId, today, tenantId, today, tenantId, today) as any;

    return {
      timestamp: new Date().toISOString(),
      recentLeads: recentActivity.recentLeads,
      recentQuotes: recentActivity.recentQuotes,
      leadsToday: todaySummary.leadsToday,
      quotesToday: todaySummary.quotesToday,
      revenueToday: todaySummary.revenueToday || 0
    };
  }

  // Export dashboard data for reporting
  async exportDashboardData(tenantId: string, format: 'json' | 'csv' = 'json', dateRange?: DateRange) {
    const metrics = await this.getDashboardMetrics(tenantId, dateRange);
    
    if (format === 'json') {
      return {
        exportDate: new Date().toISOString(),
        tenantId,
        dateRange: this.getDateRange(dateRange),
        metrics
      };
    }
    
    // CSV format - flatten key metrics
    const csvData = [
      ['Metric', 'Value'],
      ['Total Leads', metrics.totalLeads],
      ['Leads Today', metrics.leadsToday],
      ['Total Quotes', metrics.totalQuotes],
      ['Average Quote Value', metrics.averageQuoteValue],
      ['Total Revenue', metrics.totalRevenue],
      ['Conversion Rate %', metrics.quoteConversionRate],
      ['Total Yachts', metrics.totalYachts],
      ['Average Party Size', metrics.averagePartySize],
      ['Repeat Customers', metrics.repeatCustomers]
    ];
    
    return csvData.map(row => row.join(',')).join('\n');
  }
}