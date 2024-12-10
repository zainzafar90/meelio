import React from "react";

import { AnimatePresence, motion } from "framer-motion";

import { useBreathingStore } from "../store/breathing.store";

export const BreathingText: React.FC = () => {
  const { phase, isActive } = useBreathingStore();

  const textVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className="flex h-full w-full items-center justify-center text-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={phase}
          exit="exit"
          initial="initial"
          animate="animate"
          variants={textVariants}
          transition={{ duration: 0.5 }}
          className="inline-block bg-gradient-to-br from-red-600/80 to-amber-600/80 bg-clip-text text-lg font-light uppercase tracking-normal text-transparent"
        >
          {isActive
            ? phase === "inhale"
              ? "inhale"
              : phase === "hold1" || phase === "hold2"
                ? "hold"
                : "exhale"
            : "Tap to start"}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};
