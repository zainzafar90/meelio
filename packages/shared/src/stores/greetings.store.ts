import { create } from "zustand";

import mantrasEn from "../data/mantras.json";
import { getLocaleMantras } from "../data/locale-content";
import { createJSONStorage, persist } from "zustand/middleware";
import { getSeedIndexByDate } from "../utils/common.utils";

interface MantraStore {
  isMantraVisible: boolean;
  currentMantra: string;
  updateMantra: (lang?: string) => void;
  setIsMantraVisible: (isVisible: boolean) => void;
}

export const useMantraStore = create<MantraStore>()(
  persist(
    (set) => ({
      currentMantra: mantrasEn[0].text,
      isMantraVisible: false,
      updateMantra: (lang = "en") => {
        const mantras = getLocaleMantras(lang);
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
        if (state) {
          state.updateMantra();
        }
      },
    }
  )
);

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
      name: "meelio:local:greetings",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      skipHydration: false,
    }
  )
);
