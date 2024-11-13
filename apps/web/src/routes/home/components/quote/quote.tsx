import { useEffect } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { useQuoteStore } from "@/stores/quotes.store";

export const Quote = () => {
  const { currentQuote, updateQuote } = useQuoteStore();

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
      <div className="mx-auto max-w-xs rounded-lg border border-white/10 bg-gray-900/5 px-2 py-3 backdrop-blur-lg sm:max-w-xs sm:px-4 md:max-w-md lg:max-w-lg">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="text-shadow-lg md:text-md mb-4 mt-2 text-xs leading-relaxed sm:text-sm lg:text-lg"
          key={currentQuote.quote}
        >
          {currentQuote.quote} &mdash; {currentQuote.author}
        </motion.p>
      </div>
    </AnimatePresence>
  );
};
