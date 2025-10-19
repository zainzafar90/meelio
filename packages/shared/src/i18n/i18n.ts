import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import arTranslation from "./locales/ar/translation.json";
import deTranslation from "./locales/de/translation.json";
import enTranslation from "./locales/en/translation.json";
import esTranslation from "./locales/es/translation.json";
import frTranslation from "./locales/fr/translation.json";
import jaTranslation from "./locales/ja/translation.json";
import ptTranslation from "./locales/pt/translation.json";
import ruTranslation from "./locales/ru/translation.json";
import zhTranslation from "./locales/zh/translation.json";
import { env } from "../utils/env.utils";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: env.dev == true,
    interpolation: {
      escapeValue: false,
    },
    load: "languageOnly",
    supportedLngs: ["en", "de", "es", "fr", "pt", "ru", "ja", "zh", "ar"],
    nonExplicitSupportedLngs: true,
    resources: {
      en: {
        translation: enTranslation,
      },
      de: {
        translation: deTranslation,
      },
      es: {
        translation: esTranslation,
      },
      fr: {
        translation: frTranslation,
      },
      pt: {
        translation: ptTranslation,
      },
      ru: {
        translation: ruTranslation,
      },
      ja: {
        translation: jaTranslation,
      },
      zh: {
        translation: zhTranslation,
      },
      ar: {
        translation: arTranslation,
      },
    },
  });

export default i18n;
