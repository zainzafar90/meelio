import React, { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { AppLayout } from "@/layouts/app-layout";
import { playBreathingSound } from "@/utils/sound.utils";

type BreathPhase = "inhale" | "hold1" | "exhale" | "hold2";

const PHASE_DURATION = 4; // 4 seconds for each phase

const BreathingCircle: React.FC<{
  phase: BreathPhase;
  isActive: boolean;
  children: React.ReactNode;
  onClick: () => void;
}> = ({ phase, onClick, isActive, children }) => {
  const circleVariants = {
    inhale: { scale: 1.5, transition: { duration: PHASE_DURATION } },
    hold1: { scale: 1.5, transition: { duration: PHASE_DURATION } },
    exhale: { scale: 1, transition: { duration: PHASE_DURATION } },
    hold2: { scale: 1, transition: { duration: PHASE_DURATION } },
  };

  const tapAnimation = {
    scale: 0.95,
    transition: { duration: 0.1 },
  };

  return (
    <motion.button
      onClick={onClick}
      animate={isActive ? phase : {}}
      variants={circleVariants}
      whileTap={tapAnimation}
      className="relative inset-0 flex items-center justify-center size-48 bg-transparent border-none cursor-pointer focus:outline-none"
    >
      <div
        className={cn(
          "absolute inset-0 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-foreground/80 border border-[#86AFFF]/20 dark:border-[#86AFFF]/20",
          {
            "size-56 animate-concentric-ripple": isActive,
          }
        )}
        style={
          { "--delay": "0.1s", "--waves-duration": "6s" } as React.CSSProperties
        }
      />
      <div
        className={cn(
          "absolute inset-0 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-foreground/60 border border-[#86AFFF]/20 dark:border-[#86AFFF]/20",
          {
            "size-64 animate-concentric-ripple": isActive,
          }
        )}
        style={
          { "--delay": "0.4s", "--waves-duration": "6s" } as React.CSSProperties
        }
      />
      <div
        className={cn(
          "absolute inset-0 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-foreground/40 border border-[#86AFFF]/20 dark:border-[#86AFFF]/20",
          {
            "size-72 animate-concentric-ripple": isActive,
          }
        )}
        style={
          { "--delay": "0.8s", "--waves-duration": "6s" } as React.CSSProperties
        }
      />
      <div className="absolute inset-0 bg-white rounded-full">{children}</div>
    </motion.button>
  );
};

const Breathing: React.FC = () => {
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive) {
      timer = setInterval(() => {
        setCount((prevCount) => {
          if (prevCount === PHASE_DURATION - 1) {
            setPhase((currentPhase) => {
              switch (currentPhase) {
                case "inhale":
                  console.log("inhale");
                  playBreathingSound("hold");
                  return "hold1";
                case "hold1":
                  playBreathingSound("exhale");
                  return "exhale";
                case "exhale":
                  playBreathingSound("hold");
                  return "hold2";
                case "hold2":
                  playBreathingSound("inhale");
                  return "inhale";
              }
            });
            return 0;
          }
          return prevCount + 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive]);

  const toggleTimer = () => {
    setIsActive((prev) => !prev);
    if (!isActive) {
      playBreathingSound("inhale");
    }
  };

  const textVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center space-y-16 h-screen bg-gradient-to-br from-indigo-600 to-sky-600 m-6 rounded-lg font-rubik">
        <div className="relative size-80 flex items-center justify-center my-8">
          <BreathingCircle
            phase={phase}
            onClick={toggleTimer}
            isActive={isActive}
          >
            <div className="flex w-full h-full items-center justify-center text-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={phase}
                  exit="exit"
                  initial="initial"
                  animate="animate"
                  variants={textVariants}
                  transition={{ duration: 0.5 }}
                  className="text-3xl font-alumini tracking-normal font-semibold bg-gradient-to-br from-indigo-600/80 to-sky-600/80 inline-block text-transparent bg-clip-text"
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
          </BreathingCircle>
        </div>
        <p className="text-lg text-white/60">
          {isActive
            ? "Breathe in, hold, breathe out, hold. Each phase lasts 4 seconds."
            : "Tap the circle to start the breathing exercise."}
        </p>
      </div>
    </AppLayout>
  );
};

export default Breathing;
