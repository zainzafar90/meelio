import { create } from "zustand";

import quotes from "@/routes/home/components/quote/quotes.json";

interface Quote {
  quote: string;
  author: string;
}

interface QuoteStore {
  currentQuote: Quote;
  quotes: Quote[];
  updateQuote: () => void;
}

const getDayOfYear = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor(diff / oneDay);
};

export const useQuoteStore = create<QuoteStore>((set) => ({
  currentQuote: quotes[0],
  quotes,
  updateQuote: () =>
    set((state) => ({
      currentQuote: state.quotes[getDayOfYear() % state.quotes.length],
    })),
}));
