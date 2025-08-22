import { QuoteBreakdown, Yacht } from './types';

export class QuoteCalculator {
  calculateQuote(
    yacht: Yacht,
    weeks: number = 1,
    extras: number = 0
  ): QuoteBreakdown {
    const basePrice = yacht.weeklyRate * weeks;
    
    // APA (Advance Provisioning Allowance) - typically 25-30% of base charter
    const apa = Math.round(basePrice * 0.25);
    
    // VAT calculation depends on area and flag
    let vatRate = 0;
    if (yacht.area === 'Mediterranean') {
      vatRate = 0.22; // European VAT rates vary, using average
    } else if (yacht.area === 'Caribbean' || yacht.area === 'Bahamas') {
      vatRate = 0.0; // Many Caribbean jurisdictions have no VAT on charters
    }
    
    const vat = Math.round(basePrice * vatRate);
    
    // Total calculation
    const total = basePrice + apa + vat + extras;

    return {
      basePrice,
      apa,
      vat,
      extras,
      total,
      currency: yacht.currency
    };
  }

  formatQuoteBreakdown(breakdown: QuoteBreakdown): string {
    const { currency } = breakdown;
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    });

    return `
Charter Quote Breakdown:
━━━━━━━━━━━━━━━━━━━━━━━━
Base Charter Fee: ${formatter.format(breakdown.basePrice)}
APA (25%):        ${formatter.format(breakdown.apa)}
VAT:              ${formatter.format(breakdown.vat)}
Extras:           ${formatter.format(breakdown.extras)}
━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:            ${formatter.format(breakdown.total)}

* APA covers fuel, food, beverages, port fees, and other operational expenses
* VAT rates vary by jurisdiction and yacht flag
* All prices are indicative and subject to final confirmation
    `.trim();
  }

  calculateMultipleQuotes(yachts: Yacht[], weeks: number = 1, extras: number = 0): Array<{
    yacht: Yacht;
    quote: QuoteBreakdown;
  }> {
    return yachts.map(yacht => ({
      yacht,
      quote: this.calculateQuote(yacht, weeks, extras)
    }));
  }
}
