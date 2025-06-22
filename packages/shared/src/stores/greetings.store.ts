import { create } from "zustand";

import mantras from "../data/mantras.json";
import { createJSONStorage, persist } from "zustand/middleware";
import { getSeedIndexByDate } from "../utils/common.utils";

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

export const useMantraStore = create<MantraStore>()(
  persist(
    (set) => ({
      currentMantra: mantras[0].text,
      mantras: mantras.map((mantra) => mantra.text),
      isMantraVisible: false,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
        if (state) {
          const index = getSeedIndexByDate(mantras.length);
          set({ currentMantra: mantras[index].text });
        }
      },
      updateMantra: () => {
        const index = getSeedIndexByDate(mantras.length);
        set({ currentMantra: mantras[index].text });
      },
      setIsMantraVisible: (isVisible: boolean) =>
        set({ isMantraVisible: isVisible }),
    }),
    {
      name: "meelio:local:mantra",
      storage: createJSONStorage(() => localStorage),
      version: 3,
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
