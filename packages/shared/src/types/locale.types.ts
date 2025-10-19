export type LocaleCode =
  | "en"      // English
  | "de"      // Deutsch (German)
  | "es"      // Español (Spanish)
  | "fr"      // Français (French)
  | "pt"      // Português (Brazilian Portuguese)
  | "ru"      // Русский (Russian)
  | "ja"      // 日本語 (Japanese)
  | "zh"      // 简体中文 (Simplified Chinese)
  | "ar";     // العربية (Arabic)

export interface LanguageInfo {
  code: LocaleCode;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
];
