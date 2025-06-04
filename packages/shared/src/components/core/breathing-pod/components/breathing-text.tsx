import React from "react";

import { AnimatePresence, motion } from "framer-motion";

import { useBreathingStore } from "../store/breathing.store";

export const BreathingText: React.FC = () => {
  const { phase, isActive, completedSets, totalSets } = useBreathingStore();

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
          className="relative inline-block bg-gradient-to-br from-red-600/80 to-amber-600/80 bg-clip-text text-lg font-light uppercase tracking-normal text-transparent"
        >
          {isActive
            ? phase === "inhale"
              ? "inhale"
              : phase === "hold1" || phase === "hold2"
                ? "hold"
                : "exhale"
            : "Tap to start"}

          {isActive && totalSets > 0 && (
            <motion.div className="relative">
              <div className="flex flex-col text-md font-bold">
                <span className="text-red-600/40 text-3xl">
                  {totalSets - completedSets}
                </span>
                <span className="text-red-600/30 text-[6px] -mt-2">
                  reps left
                </span>
              </div>
            </motion.div>
          )}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};
