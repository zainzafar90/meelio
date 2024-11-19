import { motion } from "framer-motion";

import { BreathingCircle } from "../components/breathing-circle";
import { useBreathingTimer } from "../components/breathing-timer";
import { BreathingPatternSelector } from "./breathing-pattern-selector";

export const BreathingControl = () => {
  useBreathingTimer();

  return (
    <div className="flex w-full items-center justify-center">
      <div className="relative z-50 h-auto shrink-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.75,
          }}
          className="relative my-8 flex size-full items-center justify-center"
        >
          <BreathingCircle />
        </motion.div>

        <BreathingPatternSelector />
      </div>
    </div>
  );
};
