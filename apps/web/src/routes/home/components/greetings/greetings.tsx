import { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "@/stores/auth.store";
import { useGreetingStore, useMantraStore } from "@/stores/greetings.store";

export const Greeting = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { greeting, updateGreeting } = useGreetingStore();
  const { currentMantra, updateMantra } = useMantraStore();
  const [showMantra, setShowMantra] = useState(false);

  useEffect(() => {
    updateGreeting(new Date(), t);
    updateMantra();

    const timeInterval = setInterval(
      () => {
        updateGreeting(new Date(), t);
      },
      10 * 60 * 1000
    ); // Every 10 minutes

    const mantraInterval = setInterval(
      () => {
        updateMantra();
      },
      24 * 60 * 60 * 1000
    ); // Every 24 hours

    return () => {
      clearInterval(timeInterval);
      clearInterval(mantraInterval);
    };
  }, [t]);

  const getFirstName = () => {
    if (!user || !user.name) return "";
    return user.name.split(" ")[0];
  };

  const handleClick = () => {
    updateGreeting(new Date(), t);
    updateMantra();
    setShowMantra(!showMantra);
  };

  return (
    <div
      className="cursor-pointer space-y-4 md:space-y-6"
      onClick={handleClick}
    >
      <AnimatePresence mode="wait">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="text-shadow-lg mb-4 mt-2 text-xl font-medium sm:text-2xl md:mb-8 md:text-4xl lg:mb-16"
          key={showMantra ? currentMantra : greeting}
        >
          {showMantra ? currentMantra : greeting}
          {getFirstName() && ` — ${getFirstName()}`}
        </motion.h2>
      </AnimatePresence>
    </div>
  );
};
