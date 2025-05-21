import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cn } from "@repo/ui/lib/utils";

export const LanguageSettings = () => {
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language === "de" ? "de" : "en";

  const handleLanguageChange = (lang: "en" | "de") => {
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

      <div className="flex items-center gap-4">
        <button
          className={cn(
            "cursor-pointer w-40 h-24 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors duration-200",
            currentLang === "en"
              ? "border-2 border-blue-500 bg-white text-black dark:bg-black dark:text-white"
              : "border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          )}
          onClick={() => handleLanguageChange("en")}
          title="Switch to English"
          role="button"
        >
          <motion.span
            className={cn("text-2xl font-medium uppercase")}
            whileTap={{ scale: 0.95 }}
          >
            en
          </motion.span>
          <span className={cn("text-sm")}>English</span>
        </button>

        <button
          className={cn(
            "cursor-pointer w-40 h-24 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors duration-200",
            currentLang === "de"
              ? "border-2 border-blue-500 bg-white text-black dark:bg-black dark:text-white"
              : "border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          )}
          onClick={() => handleLanguageChange("de")}
          title="Switch to German"
          role="button"
        >
          <motion.span
            className={cn("text-2xl font-medium uppercase")}
            whileTap={{ scale: 0.95 }}
          >
            de
          </motion.span>
          <span className={cn("text-sm")}>Deutsch</span>
        </button>
      </div>
    </div>
  );
};
