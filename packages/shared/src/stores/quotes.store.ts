import { create } from "zustand";

import quotes from "../data/quotes.json";
import { getSeedIndexByDate } from "../utils/common.utils";

interface Quote {
  quote: string;
  author: string;
}

interface QuoteStore {
  currentQuote: Quote;
  quotes: Quote[];
  updateQuote: () => void;
}

export const useQuoteStore = create<QuoteStore>((set) => ({
  currentQuote: quotes[0],
  quotes,
  updateQuote: () => {
    const index = getSeedIndexByDate(quotes.length);
    set({ currentQuote: quotes[index] });
  },
}));
