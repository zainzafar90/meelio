import { QUOTES, type Quote } from "../data/quote";

export const getCustomBlockerMessage = (): Quote => {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
};
