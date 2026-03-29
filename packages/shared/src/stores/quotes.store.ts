import { create } from "zustand";

import quotesEn from "../data/quotes.json";
import { getLocaleQuotes } from "../data/locale-content";
import { getSeedIndexByDate } from "../utils/common.utils";

type Quote = { id: number; quote: string; author: string };

interface QuoteStore {
  currentQuote: Quote;
  updateQuote: (lang?: string) => void;
}

export const useQuoteStore = create<QuoteStore>((set) => ({
  currentQuote: quotesEn[0] as Quote,
  updateQuote: (lang = "en") => {
    const quotes = getLocaleQuotes(lang);
    const index = getSeedIndexByDate(quotes.length);
    set({ currentQuote: quotes[index] });
  },
}));
