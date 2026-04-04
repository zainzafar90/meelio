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
        className="mx-auto max-w-lg text-center"
        aria-label={t("home.quote.aria.quote")}
      >
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="text-xs italic leading-loose text-white/90 text-balance sm:text-sm"
          key={currentQuote.quote}
        >
          <span className="box-decoration-clone rounded-sm bg-black/20 px-2 py-0.5">
            {currentQuote.quote}
          </span>
        </motion.p>
        <span
          className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-white/50 sm:text-xs"
          aria-label={t("home.quote.aria.author")}
        >
          — {currentQuote.author}
          <QuoteIcon className="size-3 text-white/30" aria-hidden="true" />
        </span>
      </div>
    </AnimatePresence>
  );
};
