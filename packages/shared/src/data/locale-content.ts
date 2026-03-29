import quotesEn from "./quotes.json";
import quotesDe from "./quotes-de.json";
import quotesEs from "./quotes-es.json";
import quotesFr from "./quotes-fr.json";
import quotesPt from "./quotes-pt.json";
import quotesRu from "./quotes-ru.json";
import quotesJa from "./quotes-ja.json";
import quotesZh from "./quotes-zh.json";
import quotesAr from "./quotes-ar.json";

import mantrasEn from "./mantras.json";
import mantrasDe from "./mantras-de.json";
import mantrasEs from "./mantras-es.json";
import mantrasFr from "./mantras-fr.json";
import mantrasPt from "./mantras-pt.json";
import mantrasRu from "./mantras-ru.json";
import mantrasJa from "./mantras-ja.json";
import mantrasZh from "./mantras-zh.json";
import mantrasAr from "./mantras-ar.json";

type Quote = { id: number; quote: string; author: string };
type Mantra = { id: number; text: string };

const quotesByLang: Record<string, Quote[]> = {
  de: quotesDe as Quote[],
  es: quotesEs as Quote[],
  fr: quotesFr as Quote[],
  pt: quotesPt as Quote[],
  ru: quotesRu as Quote[],
  ja: quotesJa as Quote[],
  zh: quotesZh as Quote[],
  ar: quotesAr as Quote[],
};

const mantrasByLang: Record<string, Mantra[]> = {
  de: mantrasDe as Mantra[],
  es: mantrasEs as Mantra[],
  fr: mantrasFr as Mantra[],
  pt: mantrasPt as Mantra[],
  ru: mantrasRu as Mantra[],
  ja: mantrasJa as Mantra[],
  zh: mantrasZh as Mantra[],
  ar: mantrasAr as Mantra[],
};

export function getLocaleQuotes(lang: string): Quote[] {
  return quotesByLang[lang] ?? (quotesEn as Quote[]);
}

export function getLocaleMantras(lang: string): Mantra[] {
  return mantrasByLang[lang] ?? (mantrasEn as Mantra[]);
}
