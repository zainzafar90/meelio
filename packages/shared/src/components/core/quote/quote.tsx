import { useEffect } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { QuoteIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useQuoteStore } from "../../../stores/quotes.store";
import { useShallow } from "zustand/shallow";

export const Quote = () => {
  const { currentQuote, updateQuote } = useQuoteStore(
    useShallow((state) => ({
      currentQuote: state.currentQuote,
      updateQuote: state.updateQuote,
    }))
  );
  const { t, i18n } = useTranslation();

  useEffect(() => {
    updateQuote(i18n.language);

    const quoteInterval = setInterval(
      () => {
        updateQuote(i18n.language);
      },
      24 * 60 * 60 * 1000
    ); // Every 24 hours

    return () => {
      clearInterval(quoteInterval);
    };
  }, [i18n.language]);

  return (
    <AnimatePresence mode="wait">
      <div
        className="relative mx-auto max-w-md text-center"
        aria-label={t("home.quote.aria.quote")}
      >
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="text-xs italic leading-relaxed text-white/60 sm:text-sm"
          key={currentQuote.quote}
        >
          {currentQuote.quote}
        </motion.p>
        <span
          className="text-[10px] text-white/40 sm:text-xs"
          aria-label={t("home.quote.aria.author")}
        >
          — {currentQuote.author}
        </span>
        <QuoteIcon
          className="absolute bottom-2 right-2 hidden size-6 text-white/20 sm:block"
          aria-hidden="true"
        />
      </div>
    </AnimatePresence>
  );
};
