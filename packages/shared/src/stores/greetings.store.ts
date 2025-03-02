import { create } from "zustand";

import mantras from "../data/mantras.json";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * ------------
 * MANTRA STORE
 * ------------
 *
 * This store is responsible for updating the mantra based on the day of the year
 *
 */
interface MantraStore {
  currentMantra: string;
  mantras: string[];
  updateMantra: () => void;
}

const getDayOfYear = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

export const useMantraStore = create<MantraStore>((set) => ({
  currentMantra: mantras[(getDayOfYear() % mantras.length) + 1] || mantras[0],
  mantras,
  updateMantra: () =>
    set((state) => ({
      currentMantra: state.mantras[(getDayOfYear() % state.mantras.length) + 1],
    })),
  resetToDefault: () =>
    set((state) => ({
      currentMantra: state.mantras[(getDayOfYear() % state.mantras.length) + 1],
    })),
}));

/**
 * --------------
 * GREETING STORE
 * --------------
 *
 * This store is responsible for updating the greeting based on the time of day
 *
 */

interface GreetingStore {
  greeting: string;
  updateGreeting: (time: Date, t: (key: string) => string) => void;
}

const getGreeting = (hour: number, t: (key: string) => string) => {
  if (hour >= 4 && hour < 12) return t("home.greetings.morning");
  else if (hour >= 12 && hour < 17) return t("home.greetings.afternoon");
  else if (hour >= 17 && hour < 21) return t("home.greetings.evening");
  else return t("home.greetings.night");
};

export const useGreetingStore = create<GreetingStore>()(
  persist(
    (set) => ({
      greeting: "",
      updateGreeting: (time, t) => {
        const hour = time.getHours();
        const newGreeting = getGreeting(hour, t);

        set({ greeting: newGreeting });
      },
    }),
    {
      name: "meelio:local:greeting",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
