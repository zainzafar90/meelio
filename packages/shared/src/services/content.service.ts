import { getAssetPath } from "../utils/path.utils";
import { db } from "../lib/db/meelio.dexie";
import type { Mantra, Quote } from "../lib/db/models.dexie";
import { getSeedIndexByDate } from "../utils/common.utils";

interface QuoteData {
  quote: string;
  author: string;
}

interface MantraJSON {
  id: number;
  text: string;
}

interface QuoteJSON {
  id: number;
  quote: string;
  author: string;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const TOTAL_MANTRAS = 366;
const TOTAL_QUOTES = 366;

class ContentService {
  async getTodaysMantra(): Promise<string> {
    try {
      // Load all mantras first
      await this.ensureMantrasLoaded();
      
      // Get seeded index for user-specific randomness
      const seededIndex = getSeedIndexByDate(TOTAL_MANTRAS);
      
      // Get mantra by sequential ID (0-365)
      const mantra = await db.mantras.get(seededIndex);
      
      return mantra?.text || this.getFallbackMantras()[seededIndex % 10];
    } catch (error) {
      console.error("Failed to get today's mantra:", error);
      const fallbackId = getSeedIndexByDate(10);
      return this.getFallbackMantras()[fallbackId];
    }
  }

  async getTodaysQuote(): Promise<QuoteData> {
    try {
      // Load all quotes first
      await this.ensureQuotesLoaded();
      
      // Get seeded index for user-specific randomness
      const seededIndex = getSeedIndexByDate(TOTAL_QUOTES);
      
      // Get quote by sequential ID (0-365)
      const quote = await db.quotes.get(seededIndex);
      
      if (quote) {
        return { quote: quote.quote, author: quote.author };
      }

      const fallbackId = getSeedIndexByDate(3);
      return this.getFallbackQuotes()[fallbackId];
    } catch (error) {
      console.error("Failed to get today's quote:", error);
      const fallbackId = getSeedIndexByDate(3);
      return this.getFallbackQuotes()[fallbackId];
    }
  }

  private async ensureMantrasLoaded(): Promise<void> {
    try {
      const count = await db.mantras.count();
      if (count === TOTAL_MANTRAS) return; // Already loaded

      const staticMantras = await this.loadStaticMantras();
      if (staticMantras.length > 0) {
        await db.mantras.clear();
        const mantrasData: Mantra[] = staticMantras.map(m => ({
          id: m.id,
          text: m.text,
          lastUpdated: Date.now(),
        }));
        await db.mantras.bulkAdd(mantrasData);
      }
    } catch (error) {
      console.error("Failed to load mantras to cache:", error);
    }
  }

  private async ensureQuotesLoaded(): Promise<void> {
    try {
      const count = await db.quotes.count();
      if (count === TOTAL_QUOTES) return; // Already loaded

      const staticQuotes = await this.loadStaticQuotes();
      if (staticQuotes.length > 0) {
        await db.quotes.clear();
        const quotesData: Quote[] = staticQuotes.map(q => ({
          id: q.id,
          quote: q.quote,
          author: q.author,
          lastUpdated: Date.now(),
        }));
        await db.quotes.bulkAdd(quotesData);
      }
    } catch (error) {
      console.error("Failed to load quotes to cache:", error);
    }
  }

  private async loadStaticMantras(): Promise<MantraJSON[]> {
    try {
      const path = getAssetPath("/public/mantras.json");
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      return [];
    }
  }

  private async loadStaticQuotes(): Promise<QuoteJSON[]> {
    try {
      const path = getAssetPath("/public/quotes.json");
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      return [];
    }
  }

  private isStale(lastUpdated: number): boolean {
    return Date.now() - lastUpdated > CACHE_DURATION;
  }

  private getFallbackMantras(): string[] {
    return [
      "Live in the moment.",
      "Embrace each day.",
      "Keep moving forward.",
      "Let your light shine.",
      "Trust the journey.",
      "Be kind to yourself.",
      "Face challenges bravely.",
      "Choose joy daily.",
      "Stand tall and shine.",
      "Believe in new beginnings.",
    ];
  }

  private getFallbackQuotes(): QuoteData[] {
    return [
      {
        quote: "What you do today can improve all your tomorrows.",
        author: "Ralph Marston"
      },
      {
        quote: "The secret to getting ahead is getting started.",
        author: "Mark Twain"
      },
      {
        quote: "Success is walking from failure to failure with no loss of enthusiasm.",
        author: "Winston Churchill"
      },
    ];
  }

  async preloadData(): Promise<void> {
    try {
      await Promise.all([
        this.ensureMantrasLoaded(),
        this.ensureQuotesLoaded()
      ]);
    } catch (error) {
      console.error("Failed to preload data:", error);
    }
  }

  // Legacy methods for backward compatibility
  async loadMantras(): Promise<string[]> {
    await this.ensureMantrasLoaded();
    const mantras = await db.mantras.orderBy('id').toArray();
    return mantras.map(m => m.text);
  }

  async loadQuotes(): Promise<QuoteData[]> {
    await this.ensureQuotesLoaded();
    const quotes = await db.quotes.orderBy('id').toArray();
    return quotes.map(q => ({ quote: q.quote, author: q.author }));
  }
}

export const contentService = new ContentService();