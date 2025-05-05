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
  isMantraVisible: boolean;
  currentMantra: string;
  mantras: string[];
  updateMantra: () => void;
  setIsMantraVisible: (isVisible: boolean) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

const getDayOfYear = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

export const useMantraStore = create<MantraStore>()(
  persist(
    (set) => ({
      currentMantra:
        mantras[(getDayOfYear() % mantras.length) + 1] || mantras[0],
      mantras,
      isMantraVisible: false,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },
      updateMantra: () =>
        set((state) => ({
          currentMantra:
            state.mantras[(getDayOfYear() % state.mantras.length) + 1],
        })),
      setIsMantraVisible: (isVisible: boolean) =>
        set({ isMantraVisible: isVisible }),
      resetToDefault: () =>
        set((state) => ({
          currentMantra:
            state.mantras[(getDayOfYear() % state.mantras.length) + 1],
        })),
    }),
    {
      name: "meelio:local:mantra",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
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
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
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
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },
      updateGreeting: (time, t) => {
        const hour = time.getHours();
        const newGreeting = getGreeting(hour, t);

        set({ greeting: newGreeting });
      },
    }),
    {
      name: "meelio:local:greetings",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      skipHydration: false,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
