import quotesEn from "./quotes.json";
import mantrasEn from "./mantras.json";

type Quote = { id: number; quote: string; author: string };
type Mantra = { id: number; text: string };

export async function loadLocaleQuotes(lang: string): Promise<Quote[]> {
  switch (lang) {
    case "de":
      return (await import("./quotes-de.json")).default as Quote[];
    case "es":
      return (await import("./quotes-es.json")).default as Quote[];
    case "fr":
      return (await import("./quotes-fr.json")).default as Quote[];
    case "pt":
      return (await import("./quotes-pt.json")).default as Quote[];
    case "ru":
      return (await import("./quotes-ru.json")).default as Quote[];
    case "ja":
      return (await import("./quotes-ja.json")).default as Quote[];
    case "zh":
      return (await import("./quotes-zh.json")).default as Quote[];
    case "ar":
      return (await import("./quotes-ar.json")).default as Quote[];
    default:
      return quotesEn as Quote[];
  }
}

export async function loadLocaleMantras(lang: string): Promise<Mantra[]> {
  switch (lang) {
    case "de":
      return (await import("./mantras-de.json")).default as Mantra[];
    case "es":
      return (await import("./mantras-es.json")).default as Mantra[];
    case "fr":
      return (await import("./mantras-fr.json")).default as Mantra[];
    case "pt":
      return (await import("./mantras-pt.json")).default as Mantra[];
    case "ru":
      return (await import("./mantras-ru.json")).default as Mantra[];
    case "ja":
      return (await import("./mantras-ja.json")).default as Mantra[];
    case "zh":
      return (await import("./mantras-zh.json")).default as Mantra[];
    case "ar":
      return (await import("./mantras-ar.json")).default as Mantra[];
    default:
      return mantrasEn as Mantra[];
  }
}
