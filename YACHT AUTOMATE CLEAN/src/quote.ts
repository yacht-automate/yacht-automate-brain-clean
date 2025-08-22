import { QuoteBreakdown, Yacht } from './types';

export class QuoteCalculator {
  calculateQuote(
    yacht: Yacht,
    weeks: number = 1,
    apaPct: number = 25,
    vatPct?: number,
    gratuityPct: number = 0,
    deliveryFee: number = 0,
    extras: Array<{ label: string; amount: number }> = []
  ): QuoteBreakdown {
    const base = yacht.weeklyRate * weeks;
    
    // Calculate APA
    const apaAmount = Math.round(base * (apaPct / 100));
    
    // VAT calculation - use provided vatPct or auto-determine
    let finalVatPct = vatPct;
    if (finalVatPct === undefined) {
      if (yacht.area === 'Mediterranean') {
        finalVatPct = 22; // European VAT rates
      } else if (yacht.area === 'Caribbean' || yacht.area === 'Bahamas') {
        finalVatPct = 0; // Many Caribbean jurisdictions have no VAT
      } else {
        finalVatPct = 0;
      }
    }
    const vatAmount = Math.round((base + apaAmount) * (finalVatPct / 100));
    
    // Calculate gratuity
    const gratuityAmount = Math.round(base * (gratuityPct / 100));
    
    // Calculate extras total
    const extrasTotal = extras.reduce((sum, extra) => sum + extra.amount, 0);
    
    // Total calculation
    const total = base + apaAmount + vatAmount + gratuityAmount + deliveryFee + extrasTotal;

    // Build breakdown array
    const breakdown = [
      { label: 'Base', amount: base },
      { label: 'APA', amount: apaAmount },
      { label: 'VAT', amount: vatAmount },
      ...(gratuityPct > 0 ? [{ label: 'Gratuity', amount: gratuityAmount }] : []),
      ...(deliveryFee > 0 ? [{ label: 'Delivery fee', amount: deliveryFee }] : []),
      ...extras,
      { label: 'Total', amount: total }
    ];

    return {
      currency: yacht.currency,
      weeks,
      base,
      apaPct,
      apaAmount,
      vatPct: finalVatPct,
      vatAmount,
      gratuityPct,
      gratuityAmount,
      deliveryFee,
      extrasTotal,
      total,
      breakdown
    };
  }

  formatQuoteBreakdown(breakdown: QuoteBreakdown): string {
    const { currency } = breakdown;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    });

    let result = `Charter Quote Breakdown:\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    for (const item of breakdown.breakdown) {
      if (item.label === 'Total') {
        result += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        result += `${item.label.toUpperCase()}: ${formatter.format(item.amount)}\n`;
      } else {
        result += `${item.label}: ${formatter.format(item.amount)}\n`;
      }
    }

    result += `\n* APA covers fuel, food, beverages, port fees, and other operational expenses`;
    result += `\n* VAT rates vary by jurisdiction and yacht flag`;
    result += `\n* All prices are indicative and subject to final confirmation`;

    return result;
  }

  calculateMultipleQuotes(
    yachts: Yacht[], 
    weeks: number = 1, 
    apaPct: number = 25,
    vatPct?: number,
    gratuityPct: number = 0,
    deliveryFee: number = 0,
    extras: Array<{ label: string; amount: number }> = []
  ): Array<{
    yacht: Yacht;
    quote: QuoteBreakdown;
  }> {
    return yachts.map(yacht => ({
      yacht,
      quote: this.calculateQuote(yacht, weeks, apaPct, vatPct, gratuityPct, deliveryFee, extras)
    }));
  }
}
