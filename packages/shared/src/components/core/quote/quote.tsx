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
  const { t } = useTranslation();

  useEffect(() => {
    updateQuote();

    const quoteInterval = setInterval(
      () => {
        updateQuote();
      },
      24 * 60 * 60 * 1000
    ); // Every 24 hours

    return () => {
      clearInterval(quoteInterval);
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      <div
        className="relative mx-auto max-w-xs rounded-lg border border-white/10 bg-gray-900/5 p-3 text-center backdrop-blur-lg sm:max-w-xs sm:px-4 md:max-w-md lg:max-w-lg"
        aria-label={t("home.quote.aria.quote")}
      >
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="text-shadow-lg md:text-md my-2 text-sm leading-relaxed lg:text-lg"
          key={currentQuote.quote}
        >
          {currentQuote.quote}
        </motion.p>
        <span
          className="text-xxs text-white/50 sm:text-xs md:text-sm"
          aria-label={t("home.quote.aria.author")}
        >
          &mdash; {currentQuote.author}
        </span>
        <QuoteIcon
          className="absolute bottom-2 right-2 hidden size-6 text-white/20 sm:block"
          aria-hidden="true"
        />
      </div>
    </AnimatePresence>
  );
};
