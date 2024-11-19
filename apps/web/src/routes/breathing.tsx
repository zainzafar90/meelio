import React, { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { AppLayout } from "@/layouts/app-layout";
import { playBreathingSound } from "@/utils/sound.utils";

type BreathPhase = "inhale" | "hold1" | "exhale" | "hold2";

type BreathingPattern = {
  name: string;
  description: string;
  inhaleTime: number;
  hold1Time: number;
  exhaleTime: number;
  hold2Time: number;
};

const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    name: "Calm Down",
    description: "4-6 Extended Exhale",
    inhaleTime: 4,
    hold1Time: 0,
    exhaleTime: 6,
    hold2Time: 0,
  },
  {
    name: "Clear the Mind",
    description: "4-4 Equal Breathing",
    inhaleTime: 4,
    hold1Time: 0,
    exhaleTime: 4,
    hold2Time: 0,
  },
  {
    name: "Relax Deeply",
    description: "4-7-8 Breathing",
    inhaleTime: 4,
    hold1Time: 7,
    exhaleTime: 8,
    hold2Time: 0,
  },
  {
    name: "Relieve Stress",
    description: "4-4-4-4 Box Breathing",
    inhaleTime: 4,
    hold1Time: 4,
    exhaleTime: 4,
    hold2Time: 4,
  },
];

const BreathingCircle: React.FC<{
  phase: BreathPhase;
  isActive: boolean;
  children: React.ReactNode;
  onClick: () => void;
  pattern: BreathingPattern;
}> = ({ phase, onClick, isActive, children, pattern }) => {
  const circleVariants = {
    inhale: { 
      scale: 1.5, 
      transition: { duration: pattern.inhaleTime } 
    },
    hold1: { 
      scale: 1.5, 
      transition: { duration: pattern.hold1Time } 
    },
    exhale: { 
      scale: 1, 
      transition: { duration: pattern.exhaleTime } 
    },
    hold2: { 
      scale: 1, 
      transition: { duration: pattern.hold2Time } 
    },
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
      className="relative inset-0 flex size-48 cursor-pointer items-center justify-center border-none bg-transparent focus:outline-none"
    >
      <div
        className={cn(
          "absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#86AFFF]/20 bg-foreground/80 dark:border-[#86AFFF]/20",
          {
            "size-56 animate-concentric-ripple": isActive,
          }
        )}
        style={
          { 
            "--delay": "0.1s", 
            "--waves-duration": `${pattern.inhaleTime + pattern.hold1Time + pattern.exhaleTime + pattern.hold2Time}s` 
          } as React.CSSProperties
        }
      />
      <div
        className={cn(
          "absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#86AFFF]/20 bg-foreground/60 dark:border-[#86AFFF]/20",
          {
            "size-64 animate-concentric-ripple": isActive,
          }
        )}
        style={
          { 
            "--delay": "0.4s", 
            "--waves-duration": `${pattern.inhaleTime + pattern.hold1Time + pattern.exhaleTime + pattern.hold2Time}s` 
          } as React.CSSProperties
        }
      />
      <div
        className={cn(
          "absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#86AFFF]/20 bg-foreground/40 dark:border-[#86AFFF]/20",
          {
            "size-72 animate-concentric-ripple": isActive,
          }
        )}
        style={
          { 
            "--delay": "0.8s", 
            "--waves-duration": `${pattern.inhaleTime + pattern.hold1Time + pattern.exhaleTime + pattern.hold2Time}s` 
          } as React.CSSProperties
        }
      />
      <div className="absolute inset-0 rounded-full bg-white">{children}</div>
    </motion.button>
  );
};

const Breathing: React.FC = () => {
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(
    BREATHING_PATTERNS[0]
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive) {
      timer = setInterval(() => {
        setCount((prevCount) => {
          const currentPhaseTime = (() => {
            switch (phase) {
              case "inhale":
                return selectedPattern.inhaleTime;
              case "hold1":
                return selectedPattern.hold1Time;
              case "exhale":
                return selectedPattern.exhaleTime;
              case "hold2":
                return selectedPattern.hold2Time;
            }
          })();

          if (prevCount === currentPhaseTime - 1) {
            setPhase((currentPhase) => {
              switch (currentPhase) {
                case "inhale":
                  return selectedPattern.hold1Time > 0 ? "hold1" : "exhale";
                case "hold1":
                  return "exhale";
                case "exhale":
                  return selectedPattern.hold2Time > 0 ? "hold2" : "inhale";
                case "hold2":
                  return "inhale";
              }
            });
            playBreathingSound(phase);
            return 0;
          }
          return prevCount + 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, phase, selectedPattern]);

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
      <div className="font-rubik m-6 flex h-screen flex-col items-center justify-center space-y-16 rounded-lg bg-gradient-to-br from-indigo-600 to-sky-600">
        <div className="flex flex-col gap-4">
          {BREATHING_PATTERNS.map((pattern) => (
            <button
              key={pattern.name}
              onClick={() => {
                setSelectedPattern(pattern);
                setIsActive(false);
                setPhase("inhale");
                setCount(0);
              }}
              className={cn(
                "rounded-lg px-6 py-3 transition-colors",
                selectedPattern.name === pattern.name
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/15"
              )}
            >
              <div className="text-left">
                <div className="font-semibold">{pattern.name}</div>
                <div className="text-sm opacity-80">{pattern.description}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="relative my-8 flex size-80 items-center justify-center">
          <BreathingCircle
            phase={phase}
            isActive={isActive}
            onClick={toggleTimer}
            pattern={selectedPattern}
          >
            <div className="flex h-full w-full items-center justify-center text-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={phase}
                  exit="exit"
                  initial="initial"
                  animate="animate"
                  variants={textVariants}
                  transition={{ duration: 0.5 }}
                  className="inline-block bg-gradient-to-br from-indigo-600/80 to-sky-600/80 bg-clip-text font-alumini text-3xl font-semibold tracking-normal text-transparent"
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
            ? `${selectedPattern.name}: ${selectedPattern.description}`
            : "Select a breathing pattern and tap the circle to start"}
        </p>
      </div>
    </AppLayout>
  );
};

export default Breathing;
