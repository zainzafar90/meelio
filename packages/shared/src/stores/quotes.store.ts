import { create } from "zustand";

import { getSeedIndexByDate } from "../utils/common.utils";
import { contentService } from "../services/content.service";

interface Quote {
  quote: string;
  author: string;
}

interface QuoteStore {
  currentQuote: Quote;
  updateQuote: () => void;
}

// Load today's quote eagerly in background 
contentService.getTodaysQuote().then((quote) => {
  useQuoteStore.setState({ 
    currentQuote: quote
  });
}).catch((error) => {
  console.error("Failed to load today's quote:", error);
});

export const useQuoteStore = create<QuoteStore>((set, get) => ({
  currentQuote: {
    quote: "What you do today can improve all your tomorrows.",
    author: "Ralph Marston"
  },
  updateQuote: () => {
    // Always fetch today's quote directly
    contentService.getTodaysQuote().then((quote) => {
      set({ currentQuote: quote });
    }).catch((error) => {
      console.error("Failed to update quote:", error);
    });
  },
}));
