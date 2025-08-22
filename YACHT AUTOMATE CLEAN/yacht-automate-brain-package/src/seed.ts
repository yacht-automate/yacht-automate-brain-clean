import { DatabaseService } from './db';
import { Yacht } from './types';

export class SeedService {
  constructor(private db: DatabaseService) {}

  seedYachts(tenantId: string): number {
    const yachts = this.generateDemoYachts(tenantId);
    
    let seeded = 0;
    for (const yacht of yachts) {
      try {
        this.db.createYacht(yacht);
        seeded++;
      } catch (error) {
        console.error(`Failed to seed yacht ${yacht.name}:`, error);
      }
    }

    return seeded;
  }

  private generateDemoYachts(tenantId: string): Omit<Yacht, 'id' | 'createdAt' | 'updatedAt'>[] {
    return [
      // Mediterranean yachts (20)
      {
        tenantId,
        name: 'AQUA LIBRA',
        builder: 'Benetti',
        type: 'Motor Yacht',
        length: 73,
        area: 'Mediterranean',
        cabins: 6,
        guests: 12,
        weeklyRate: 195000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'SPECTRE',
        builder: 'Sunseeker',
        type: 'Motor Yacht',
        length: 69,
        area: 'Mediterranean',
        cabins: 5,
        guests: 10,
        weeklyRate: 175000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'SERENITY',
        builder: 'Sanlorenzo',
        type: 'Motor Yacht',
        length: 64,
        area: 'Mediterranean',
        cabins: 5,
        guests: 10,
        weeklyRate: 165000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'PHOENIX',
        builder: 'Lurssen',
        type: 'Motor Yacht',
        length: 90,
        area: 'Mediterranean',
        cabins: 8,
        guests: 16,
        weeklyRate: 350000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'MYSTIC',
        builder: 'Heesen',
        type: 'Motor Yacht',
        length: 55,
        area: 'Mediterranean',
        cabins: 4,
        guests: 8,
        weeklyRate: 125000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'BLUE MOON',
        builder: 'Feadship',
        type: 'Motor Yacht',
        length: 67,
        area: 'Mediterranean',
        cabins: 5,
        guests: 10,
        weeklyRate: 185000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'AZURE',
        builder: 'Azimut',
        type: 'Motor Yacht',
        length: 35,
        area: 'Mediterranean',
        cabins: 3,
        guests: 6,
        weeklyRate: 45000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'DREAM WEAVER',
        builder: 'Perini Navi',
        type: 'Sailing Yacht',
        length: 60,
        area: 'Mediterranean',
        cabins: 4,
        guests: 8,
        weeklyRate: 95000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'SEAHAWK',
        builder: 'Ferretti',
        type: 'Motor Yacht',
        length: 28,
        area: 'Mediterranean',
        cabins: 3,
        guests: 6,
        weeklyRate: 35000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'WIND SPIRIT',
        builder: 'Wally',
        type: 'Sailing Yacht',
        length: 48,
        area: 'Mediterranean',
        cabins: 3,
        guests: 6,
        weeklyRate: 65000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'CRYSTAL CLEAR',
        builder: 'Princess',
        type: 'Motor Yacht',
        length: 32,
        area: 'Mediterranean',
        cabins: 3,
        guests: 6,
        weeklyRate: 42000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'ARTEMIS',
        builder: 'Oceanco',
        type: 'Motor Yacht',
        length: 85,
        area: 'Mediterranean',
        cabins: 7,
        guests: 14,
        weeklyRate: 295000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'MIRAGE',
        builder: 'Riva',
        type: 'Motor Yacht',
        length: 30,
        area: 'Mediterranean',
        cabins: 2,
        guests: 4,
        weeklyRate: 38000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'ODYSSEY',
        builder: 'Baglietto',
        type: 'Motor Yacht',
        length: 52,
        area: 'Mediterranean',
        cabins: 4,
        guests: 8,
        weeklyRate: 98000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'SOLARIS',
        builder: 'Amels',
        type: 'Motor Yacht',
        length: 78,
        area: 'Mediterranean',
        cabins: 6,
        guests: 12,
        weeklyRate: 225000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'TEMPEST',
        builder: 'CRN',
        type: 'Motor Yacht',
        length: 61,
        area: 'Mediterranean',
        cabins: 5,
        guests: 10,
        weeklyRate: 145000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'ZEPHYR',
        builder: 'Baltic',
        type: 'Sailing Yacht',
        length: 54,
        area: 'Mediterranean',
        cabins: 4,
        guests: 8,
        weeklyRate: 75000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'INFINITY',
        builder: 'Mangusta',
        type: 'Motor Yacht',
        length: 39,
        area: 'Mediterranean',
        cabins: 3,
        guests: 6,
        weeklyRate: 55000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'HARMONY',
        builder: 'Pershing',
        type: 'Motor Yacht',
        length: 26,
        area: 'Mediterranean',
        cabins: 2,
        guests: 4,
        weeklyRate: 28000,
        currency: 'EUR'
      },
      {
        tenantId,
        name: 'ELYSIUM',
        builder: 'Codecasa',
        type: 'Motor Yacht',
        length: 65,
        area: 'Mediterranean',
        cabins: 5,
        guests: 10,
        weeklyRate: 155000,
        currency: 'EUR'
      },

      // Caribbean yachts (10)
      {
        tenantId,
        name: 'CARIBBEAN DREAM',
        builder: 'Westport',
        type: 'Motor Yacht',
        length: 40,
        area: 'Caribbean',
        cabins: 4,
        guests: 8,
        weeklyRate: 85000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'TROPICAL BLISS',
        builder: 'Hatteras',
        type: 'Motor Yacht',
        length: 32,
        area: 'Caribbean',
        cabins: 3,
        guests: 6,
        weeklyRate: 55000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'ISLAND TIME',
        builder: 'Lagoon',
        type: 'Catamaran',
        length: 25,
        area: 'Caribbean',
        cabins: 4,
        guests: 8,
        weeklyRate: 32000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'PARADISE FOUND',
        builder: 'Trinity',
        type: 'Motor Yacht',
        length: 58,
        area: 'Caribbean',
        cabins: 5,
        guests: 10,
        weeklyRate: 125000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'OCEAN BREEZE',
        builder: 'Fountaine Pajot',
        type: 'Catamaran',
        length: 20,
        area: 'Caribbean',
        cabins: 3,
        guests: 6,
        weeklyRate: 25000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'WINDWARD',
        builder: 'Oyster',
        type: 'Sailing Yacht',
        length: 37,
        area: 'Caribbean',
        cabins: 3,
        guests: 6,
        weeklyRate: 45000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'AZURE SKY',
        builder: 'Viking',
        type: 'Motor Yacht',
        length: 24,
        area: 'Caribbean',
        cabins: 2,
        guests: 4,
        weeklyRate: 35000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'SAPPHIRE',
        builder: 'Christensen',
        type: 'Motor Yacht',
        length: 48,
        area: 'Caribbean',
        cabins: 4,
        guests: 8,
        weeklyRate: 95000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'WAVE DANCER',
        builder: 'Bali',
        type: 'Catamaran',
        length: 18,
        area: 'Caribbean',
        cabins: 3,
        guests: 6,
        weeklyRate: 22000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'SUNSET CRUISE',
        builder: 'Palmer Johnson',
        type: 'Motor Yacht',
        length: 46,
        area: 'Caribbean',
        cabins: 4,
        guests: 8,
        weeklyRate: 88000,
        currency: 'USD'
      },

      // Bahamas yachts (10)
      {
        tenantId,
        name: 'BAHAMA MAMA',
        builder: 'Lazzara',
        type: 'Motor Yacht',
        length: 35,
        area: 'Bahamas',
        cabins: 3,
        guests: 6,
        weeklyRate: 58000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'CONCH REPUBLIC',
        builder: 'Sea Ray',
        type: 'Motor Yacht',
        length: 28,
        area: 'Bahamas',
        cabins: 2,
        guests: 4,
        weeklyRate: 38000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'EXUMA EXPLORER',
        builder: 'Nordhavn',
        type: 'Motor Yacht',
        length: 43,
        area: 'Bahamas',
        cabins: 4,
        guests: 8,
        weeklyRate: 75000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'CRYSTAL WATERS',
        builder: 'Leopard',
        type: 'Catamaran',
        length: 23,
        area: 'Bahamas',
        cabins: 4,
        guests: 8,
        weeklyRate: 35000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'ISLAND HOPPER',
        builder: 'Boston Whaler',
        type: 'Motor Yacht',
        length: 20,
        area: 'Bahamas',
        cabins: 2,
        guests: 4,
        weeklyRate: 25000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'NASSAU NIGHTS',
        builder: 'Ocean Alexander',
        type: 'Motor Yacht',
        length: 38,
        area: 'Bahamas',
        cabins: 3,
        guests: 6,
        weeklyRate: 62000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'BLUE LAGOON',
        builder: 'Sunseeker',
        type: 'Motor Yacht',
        length: 31,
        area: 'Bahamas',
        cabins: 3,
        guests: 6,
        weeklyRate: 48000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'TRADE WINDS',
        builder: 'Jeanneau',
        type: 'Sailing Yacht',
        length: 16,
        area: 'Bahamas',
        cabins: 2,
        guests: 4,
        weeklyRate: 18000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'ATLANTIS DREAM',
        builder: 'Hargrave',
        type: 'Motor Yacht',
        length: 42,
        area: 'Bahamas',
        cabins: 4,
        guests: 8,
        weeklyRate: 72000,
        currency: 'USD'
      },
      {
        tenantId,
        name: 'PARADISE COVE',
        builder: 'Azimut',
        type: 'Motor Yacht',
        length: 26,
        area: 'Bahamas',
        cabins: 2,
        guests: 4,
        weeklyRate: 32000,
        currency: 'USD'
      }
    ];
  }
}
