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
            "cursor-pointer",
            "w-40 h-24 rounded-xl shadow-lg",
            "flex flex-col items-center justify-center gap-1",
            "transition-colors duration-200",
            "bg-gradient-to-b",
            currentLang === "en"
              ? "from-blue-500/20 to-purple-500/20 ring-2 ring-white/50"
              : "from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800"
          )}
          onClick={() => handleLanguageChange("en")}
          title="Switch to English"
          role="button"
        >
          <motion.span
            className={cn(
              "text-2xl font-medium uppercase",
              currentLang === "en" ? "text-white" : "text-white/70"
            )}
            whileTap={{ scale: 0.95 }}
          >
            en
          </motion.span>
          <span
            className={cn(
              "text-sm",
              currentLang === "en" ? "text-white/90" : "text-white/50"
            )}
          >
            English
          </span>
        </button>

        <button
          className={cn(
            "cursor-pointer",
            "w-40 h-24 rounded-xl shadow-lg",
            "flex flex-col items-center justify-center gap-1",
            "transition-colors duration-200",
            "bg-gradient-to-b",
            currentLang === "de"
              ? "from-blue-500/20 to-purple-500/20 ring-2 ring-white/50"
              : "from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800"
          )}
          onClick={() => handleLanguageChange("de")}
          title="Switch to German"
          role="button"
        >
          <motion.span
            className={cn(
              "text-2xl font-medium uppercase",
              currentLang === "de" ? "text-white" : "text-white/70"
            )}
            whileTap={{ scale: 0.95 }}
          >
            de
          </motion.span>
          <span
            className={cn(
              "text-sm",
              currentLang === "de" ? "text-white/90" : "text-white/50"
            )}
          >
            Deutsch
          </span>
        </button>
      </div>
    </div>
  );
};
