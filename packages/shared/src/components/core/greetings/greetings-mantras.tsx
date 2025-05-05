import { useEffect } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../../../stores/auth.store";
import { useAppStore } from "../../../stores/app.store";
import { useShallow } from "zustand/shallow";
import {
  useGreetingStore,
  useMantraStore,
} from "../../../stores/greetings.store";
import { useInterval } from "../../../hooks";

export const Greeting = () => {
  const { user, guestUser } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      guestUser: state.guestUser,
    }))
  );
  const { t } = useTranslation();
  const { mantraRotationCount, mantraRotationEnabled } = useAppStore(
    useShallow((state) => ({
      mantraRotationCount: state.mantraRotationCount,
      mantraRotationEnabled: state.mantraRotationEnabled,
    }))
  );
  const { greeting, updateGreeting } = useGreetingStore(
    useShallow((state) => ({
      greeting: state.greeting,
      updateGreeting: state.updateGreeting,
    }))
  );
  const { currentMantra, updateMantra, isMantraVisible, setIsMantraVisible } =
    useMantraStore(
      useShallow((state) => ({
        currentMantra: state.currentMantra,
        updateMantra: state.updateMantra,
        isMantraVisible: state.isMantraVisible,
        setIsMantraVisible: state.setIsMantraVisible,
      }))
    );
  const showMantra = mantraRotationEnabled
    ? mantraRotationCount % 2 === 0
    : isMantraVisible;

  useEffect(() => {
    updateGreeting(new Date(), t);
    updateMantra();
  }, [t]);

  useInterval(
    () => {
      updateGreeting(new Date(), t);
    },
    10 * 60 * 1000
  );

  useInterval(
    () => {
      updateMantra();
    },
    24 * 60 * 60 * 1000
  );

  const getFirstName = () => {
    if (!user && !guestUser) return "";
    if (user) return user?.name?.split(" ")[0];
    if (guestUser) return guestUser?.name?.split(" ")[0];
  };

  const handleClick = () => {
    updateGreeting(new Date(), t);
    updateMantra();
    setIsMantraVisible(!isMantraVisible);
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
          className="relative font-semibold text-xl sm:text-2xl md:text-4xl lg:text-4xl mb-8 mt-2 md:mb-12 lg:mb-16 [text-shadow:_0_1px_2px_rgba(0,0,0,0.1)]"
          key={
            showMantra
              ? "mantra" + mantraRotationCount
              : "greeting" + mantraRotationCount
          }
        >
          {showMantra ? currentMantra : greeting}
          {getFirstName() && ` — ${getFirstName()}`}
        </motion.h2>
      </AnimatePresence>
    </div>
  );
};
