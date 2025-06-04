import { create } from "zustand";

import { playBreathingSound } from "../../../../utils/sound.utils";

export type BreathingSounds = {
  inhaleExhale: string;
  hold: string;
};

export type BreathPhase = "inhale" | "hold1" | "exhale" | "hold2";

export type BreathingMethod = {
  name: string;
  description: string;
  details: string;
  inhaleTime: number;
  hold1Time: number;
  exhaleTime: number;
  hold2Time: number;
  className?: string;
  sounds: BreathingSounds;
};

export const BREATHING_METHODS: BreathingMethod[] = [
  {
    name: "Calm Down",
    description: "4-6 Extended Exhale",
    details: "Inhale for 4 seconds, exhale for 6 seconds",
    inhaleTime: 4,
    hold1Time: 0,
    exhaleTime: 6,
    hold2Time: 0,
    className: "text-amber-400 bg-amber-900/5 dark:bg-amber-900/10",
    sounds: {
      inhaleExhale: "/public/sounds/breathing/inhale-exhale.mp3",
      hold: "/public/sounds/breathing/hold.mp3",
    },
  },
  {
    name: "Clear the Mind",
    description: "4-4 Equal Breathing",
    details: "Inhale for 4 seconds, exhale for 4 seconds",
    inhaleTime: 4,
    hold1Time: 0,
    exhaleTime: 4,
    hold2Time: 0,
    className: "text-green-400 bg-green-900/5 dark:bg-green-900/10",
    sounds: {
      inhaleExhale: "/public/sounds/breathing/inhale-exhale.mp3",
      hold: "/public/sounds/breathing/hold.mp3",
    },
  },
  {
    name: "Relax Deeply",
    description: "4-7-8 Breathing",
    details: "Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds",
    inhaleTime: 4,
    hold1Time: 7,
    exhaleTime: 8,
    hold2Time: 0,
    className: "text-blue-400 bg-blue-900/5 bg-blue-900/10",
    sounds: {
      inhaleExhale: "/public/sounds/breathing/inhale-exhale.mp3",
      hold: "/public/sounds/breathing/hold.mp3",
    },
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
    className: "text-purple-400 bg-indigo-900/5 bg-indigo-900/10",
    sounds: {
      inhaleExhale: "/public/sounds/breathing/inhale-exhale.mp3",
      hold: "/public/sounds/breathing/hold.mp3",
    },
  },
];

interface BreathingState {
  phase: BreathPhase;
  count: number;
  isActive: boolean;
  selectedMethod: BreathingMethod;
  sessionLength: number;
  totalSets: number;
  completedSets: number;
  setPhase: (phase: BreathPhase) => void;
  setSessionLength: (length: number) => void;
  incrementCompletedSets: () => void;
  stop: () => void;
  setCount: (count: number | ((prev: number) => number)) => void;
  toggleActive: () => void;
  setSelectedMethod: (method: BreathingMethod) => void;
  getCurrentPhaseTime: () => number;
  getNextPhase: () => BreathPhase;
  reset: () => void;
}

export const useBreathingStore = create<BreathingState>((set, get) => ({
  phase: "inhale",
  count: 0,
  isActive: false,
  selectedMethod: BREATHING_METHODS[0],
  sessionLength: 1,
  totalSets: 0,
  completedSets: 0,

  setPhase: (phase) => set({ phase }),

  setSessionLength: (length) => set({ sessionLength: length }),

  incrementCompletedSets: () =>
    set((state) => ({ completedSets: state.completedSets + 1 })),

  stop: () => set({ isActive: false, phase: "inhale", count: 0 }),

  setCount: (countOrUpdater) =>
    set((state) => ({
      count:
        typeof countOrUpdater === "function"
          ? countOrUpdater(state.count)
          : countOrUpdater,
    })),

  toggleActive: () => {
    const state = get();
    const newIsActive = !state.isActive;

    const updates: Partial<BreathingState> = {
      isActive: newIsActive,
      phase: "inhale",
      count: 0,
    };

    if (newIsActive) {
      const cycleDuration =
        state.selectedMethod.inhaleTime +
        state.selectedMethod.hold1Time +
        state.selectedMethod.exhaleTime +
        state.selectedMethod.hold2Time;
      updates.totalSets = Math.floor((state.sessionLength * 60) / cycleDuration);
      updates.completedSets = 0;
    }

    set(updates as BreathingState);

    if (newIsActive) {
      playBreathingSound("inhale", state.selectedMethod.sounds);
    }
  },

  setSelectedMethod: (method) => {
    set((state) => ({
      selectedMethod: method,
      phase: "inhale",
      count: 0,
      isActive: false,
      totalSets: 0,
      completedSets: 0,
    }));
  },

  getCurrentPhaseTime: () => {
    const { phase, selectedMethod: selectedMethod } = get();
    switch (phase) {
      case "inhale":
        return selectedMethod.inhaleTime;
      case "hold1":
        return selectedMethod.hold1Time;
      case "exhale":
        return selectedMethod.exhaleTime;
      case "hold2":
        return selectedMethod.hold2Time;
    }
  },

  getNextPhase: () => {
    const { phase, selectedMethod } = get();
    switch (phase) {
      case "inhale":
        return selectedMethod.hold1Time > 0 ? "hold1" : "exhale";
      case "hold1":
        return "exhale";
      case "exhale":
        return selectedMethod.hold2Time > 0 ? "hold2" : "inhale";
      case "hold2":
        return "inhale";
    }
  },

  reset: () => {
    set({
      phase: "inhale",
      count: 0,
      isActive: false,
      selectedMethod: BREATHING_METHODS[0],
      totalSets: 0,
      completedSets: 0,
    });
  },
}));
