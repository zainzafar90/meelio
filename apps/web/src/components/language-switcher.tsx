import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "de" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      className={cn(
        "flex size-12 items-center justify-center rounded-xl shadow-lg transition-all duration-200 hover:scale-105",
        "cursor-pointer bg-gradient-to-b from-zinc-800 to-zinc-900"
      )}
      onClick={toggleLanguage}
      title={i18n.language === "en" ? "Switch to German" : "Switch to English"}
      role="button"
    >
      <AnimatePresence mode="wait">
        <motion.span
          className="text-base font-medium text-white"
          key={i18n.language}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {i18n.language === "en" ? "EN" : "DE"}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};
