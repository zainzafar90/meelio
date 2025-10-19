import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cn } from "@repo/ui/lib/utils";
import {
  SUPPORTED_LANGUAGES,
  type LocaleCode,
} from "../../../../types/locale.types";

export const LanguageSettings = () => {
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language as LocaleCode;

  const handleLanguageChange = (lang: LocaleCode) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("settings.language.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("settings.language.description")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {SUPPORTED_LANGUAGES.map((language) => {
          const isSelected =
            currentLang === language.code ||
            (currentLang.startsWith(language.code.split("-")[0]) &&
              language.code.includes("-"));

          return (
            <button
              key={language.code}
              className={cn(
                "cursor-pointer h-24 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors duration-200",
                isSelected
                  ? "border-2 border-blue-500 bg-white text-black dark:bg-black dark:text-white"
                  : "border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              )}
              onClick={() => handleLanguageChange(language.code)}
              title={`Switch to ${language.name}`}
              role="button"
            >
              <motion.span
                className={cn("text-2xl font-medium uppercase")}
                whileTap={{ scale: 0.95 }}
              >
                {language.code}
              </motion.span>
              <span className={cn("text-sm text-center px-2")}>
                {language.nativeName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
