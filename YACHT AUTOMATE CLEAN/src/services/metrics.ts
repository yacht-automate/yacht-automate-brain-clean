interface MetricsCounters {
  leads_total: number;
  emails_total: number;
  quotes_total: number;
  requests_total: number;
  errors_total: number;
}

export class MetricsService {
  private counters: MetricsCounters = {
    leads_total: 0,
    emails_total: 0,
    quotes_total: 0,
    requests_total: 0,
    errors_total: 0
  };

  increment(metric: keyof MetricsCounters, value: number = 1) {
    this.counters[metric] += value;
  }

  getCounters(): MetricsCounters {
    return { ...this.counters };
  }

  // Prometheus-style metrics format
  getPrometheusMetrics(): string {
    const timestamp = Date.now();
    return Object.entries(this.counters)
      .map(([name, value]) => `yacht_automate_${name} ${value} ${timestamp}`)
      .join('\n') + '\n';
  }

  reset() {
    Object.keys(this.counters).forEach(key => {
      this.counters[key as keyof MetricsCounters] = 0;
    });
  }
}