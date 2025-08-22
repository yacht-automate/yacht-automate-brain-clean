import { DatabaseService } from './db';
import { Yacht, MatchResult } from './types';

export class YachtMatcher {
  constructor(private db: DatabaseService) {}

  matchYachts(
    tenantId: string,
    query: string,
    partySize: number,
    location?: string,
    strictGuests: boolean = true
  ): MatchResult[] {
    // Tokenize the query
    const tokens = this.tokenizeQuery(query.toLowerCase());
    
    // Map location to areas
    const areas = this.mapLocationToAreas(location || '');
    
    // Get all yachts for tenant
    let searchResult = this.db.searchYachts(tenantId, {
      guests: strictGuests ? partySize : undefined,
      strictGuests: strictGuests
    });

    let yachts = searchResult.items;

    // Filter by areas if specified
    if (areas.length > 0) {
      yachts = yachts.filter(yacht => areas.includes(yacht.area));
    }

    // Score each yacht
    const results: MatchResult[] = yachts.map(yacht => ({
      yacht,
      score: this.calculateScore(yacht, tokens, areas, partySize)
    }));

    // Sort by score (descending) then price (ascending)
    results.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.yacht.weeklyRate - b.yacht.weeklyRate;
    });

    return results;
  }

  private tokenizeQuery(query: string): string[] {
    // Remove punctuation and split on whitespace
    const tokens = query
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);

    return tokens;
  }

  private mapLocationToAreas(location: string): string[] {
    const locationLower = location.toLowerCase();
    const areas: string[] = [];

    // Mediterranean variations
    if (locationLower.includes('med') || 
        locationLower.includes('mediterranean') ||
        locationLower.includes('france') ||
        locationLower.includes('italy') ||
        locationLower.includes('spain') ||
        locationLower.includes('greece') ||
        locationLower.includes('croatia') ||
        locationLower.includes('monaco') ||
        locationLower.includes('riviera')) {
      areas.push('Mediterranean');
    }

    // Caribbean variations
    if (locationLower.includes('caribbean') ||
        locationLower.includes('barbados') ||
        locationLower.includes('antigua') ||
        locationLower.includes('st lucia') ||
        locationLower.includes('grenada') ||
        locationLower.includes('martinique') ||
        locationLower.includes('dominica') ||
        locationLower.includes('bvi') ||
        locationLower.includes('virgin islands')) {
      areas.push('Caribbean');
    }

    // Bahamas variations
    if (locationLower.includes('bahamas') ||
        locationLower.includes('nassau') ||
        locationLower.includes('exuma') ||
        locationLower.includes('eleuthera')) {
      areas.push('Bahamas');
    }

    return areas;
  }

  private calculateScore(
    yacht: Yacht,
    tokens: string[],
    areas: string[],
    partySize: number
  ): number {
    let score = 0;

    // Area match bonus
    if (areas.includes(yacht.area)) {
      score += 100;
    }

    // Token matches in yacht name, builder, or type
    const searchableText = `${yacht.name} ${yacht.builder} ${yacht.type}`.toLowerCase();
    
    tokens.forEach(token => {
      if (searchableText.includes(token)) {
        score += 10;
      }
    });

    // Guest capacity bonus (closer to requested is better)
    const guestDiff = Math.abs(yacht.guests - partySize);
    if (guestDiff === 0) {
      score += 50;
    } else if (guestDiff <= 2) {
      score += 30;
    } else if (guestDiff <= 4) {
      score += 10;
    }

    // Type bonuses for common search terms
    tokens.forEach(token => {
      if (token === 'motor' && yacht.type.toLowerCase().includes('motor')) {
        score += 20;
      }
      if (token === 'sail' && yacht.type.toLowerCase().includes('sail')) {
        score += 20;
      }
      if (token === 'catamaran' && yacht.type.toLowerCase().includes('catamaran')) {
        score += 20;
      }
      if (token === 'luxury' && yacht.weeklyRate > 50000) {
        score += 15;
      }
    });

    return score;
  }
}
