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
      <span className="text-base font-medium text-white">
        {i18n.language === "en" ? "EN" : "DE"}
      </span>
    </button>
  );
};
