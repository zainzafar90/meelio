import { QUOTES, type Quote } from "@/config/quote";

export const getCustomBlockerMessage = (): Quote => {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
};
