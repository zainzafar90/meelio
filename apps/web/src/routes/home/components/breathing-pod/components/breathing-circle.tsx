import React from "react";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import { useBreathingStore } from "../store/breathing.store";
import { BreathingRings } from "./breathing-rings";
import { BreathingText } from "./breathing-text";

export const BreathingCircle: React.FC = () => {
  const { phase, isActive, selectedMethod, toggleActive } = useBreathingStore();

  const circleVariants = {
    inhale: {
      scale: 1.5,
      transition: { duration: selectedMethod.inhaleTime },
    },
    hold1: {
      scale: 1.5,
      transition: { duration: selectedMethod.hold1Time },
    },
    exhale: {
      scale: 1,
      transition: { duration: selectedMethod.exhaleTime },
    },
    hold2: {
      scale: 1,
      transition: { duration: selectedMethod.hold2Time },
    },
  };

  const tapAnimation = {
    scale: 0.95,
    transition: { duration: 0.1 },
  };

  return (
    <motion.button
      onClick={toggleActive}
      animate={isActive ? phase : {}}
      variants={circleVariants}
      whileTap={tapAnimation}
      className="relative inset-0 flex size-48 cursor-pointer items-center justify-center border-none bg-transparent focus:outline-none"
    >
      {/* Idle state rings */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: isActive ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial="idle"
          animate="active"
          variants={{ idle: {}, active: {} }}
          className="size-full"
        >
          <BreathingRings />
        </motion.div>
      </motion.div>

      {/* Active state circles */}
      <motion.div
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {[0.1, 0.4, 0.8].map((delay, index) => (
          <div
            key={delay}
            className={cn(
              "absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#86AFFF]/20 dark:border-[#86AFFF]/20",
              {
                "size-56 animate-concentric-ripple bg-foreground/80":
                  index === 0 && isActive,
                "size-64 animate-concentric-ripple bg-foreground/60":
                  index === 1 && isActive,
                "size-72 animate-concentric-ripple bg-foreground/40":
                  index === 2 && isActive,
              }
            )}
            style={
              {
                "--delay": `${delay}s`,
                "--waves-duration": `${
                  selectedMethod.inhaleTime +
                  selectedMethod.hold1Time +
                  selectedMethod.exhaleTime +
                  selectedMethod.hold2Time
                }s`,
              } as React.CSSProperties
            }
          />
        ))}
      </motion.div>

      <div className="absolute inset-0 rounded-full bg-white">
        <BreathingText />
      </div>
    </motion.button>
  );
};
