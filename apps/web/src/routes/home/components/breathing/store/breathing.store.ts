import { create } from "zustand";

import { playBreathingSound } from "@/utils/sound.utils";

export type BreathPhase = "inhale" | "hold1" | "exhale" | "hold2";

export type BreathingPattern = {
  name: string;
  description: string;
  details: string;
  inhaleTime: number;
  hold1Time: number;
  exhaleTime: number;
  hold2Time: number;
  className?: string;
};

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    name: "Calm Down",
    description: "4-6 Extended Exhale",
    details: "Inhale for 4 seconds, exhale for 6 seconds",
    inhaleTime: 4,
    hold1Time: 0,
    exhaleTime: 6,
    hold2Time: 0,
    className:"text-amber-400 bg-amber-900/10",
  },
  {
    name: "Clear the Mind",
    description: "4-4 Equal Breathing",
    details: "Inhale for 4 seconds, exhale for 4 seconds",
    inhaleTime: 4,
    hold1Time: 0,
    exhaleTime: 4,
    hold2Time: 0,
    className:"text-green-400 bg-green-900/10",
  },
  {
    name: "Relax Deeply",
    description: "4-7-8 Breathing",
    details: "Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds",
    inhaleTime: 4,
    hold1Time: 7,
    exhaleTime: 8,
    hold2Time: 0,
    className:"text-blue-400 bg-blue-900/10",
  },
  {
    name: "Relieve Stress",
    description: "4-4-4-4 Box Breathing",
    details:
      "Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, hold for 4 seconds",
    inhaleTime: 4,
    hold1Time: 4,
    exhaleTime: 4,
    hold2Time: 4,
    className:"text-purple-400 bg-indigo-900/10",
  },
];

interface BreathingState {
  phase: BreathPhase;
  count: number;
  isActive: boolean;
  selectedPattern: BreathingPattern;
  setPhase: (phase: BreathPhase) => void;
  setCount: (count: number | ((prev: number) => number)) => void;
  toggleActive: () => void;
  setSelectedPattern: (pattern: BreathingPattern) => void;
  getCurrentPhaseTime: () => number;
  getNextPhase: () => BreathPhase;
  reset: () => void;
}

export const useBreathingStore = create<BreathingState>((set, get) => ({
  phase: "inhale",
  count: 0,
  isActive: false,
  selectedPattern: BREATHING_PATTERNS[0],

  setPhase: (phase) => set({ phase }),

  setCount: (countOrUpdater) =>
    set((state) => ({
      count:
        typeof countOrUpdater === "function"
          ? countOrUpdater(state.count)
          : countOrUpdater,
    })),

  toggleActive: () => {
    const isCurrentlyActive = get().isActive;
    const newIsActive = !isCurrentlyActive;

    set({ isActive: newIsActive });

    if (newIsActive) {
      playBreathingSound("inhale");
    }
  },

  setSelectedPattern: (pattern) => {
    set({
      selectedPattern: pattern,
      phase: "inhale",
      count: 0,
      isActive: false,
    });
  },

  getCurrentPhaseTime: () => {
    const { phase, selectedPattern } = get();
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
  },

  getNextPhase: () => {
    const { phase, selectedPattern } = get();
    switch (phase) {
      case "inhale":
        return selectedPattern.hold1Time > 0 ? "hold1" : "exhale";
      case "hold1":
        return "exhale";
      case "exhale":
        return selectedPattern.hold2Time > 0 ? "hold2" : "inhale";
      case "hold2":
        return "inhale";
    }
  },

  reset: () => {
    set({
      phase: "inhale",
      count: 0,
      isActive: false,
      selectedPattern: BREATHING_PATTERNS[0],
    });
  },
}));
