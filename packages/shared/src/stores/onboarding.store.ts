import { create } from "zustand";

import { createJSONStorage, persist } from "zustand/middleware";

interface OnboardingState {
  hasDockOnboardingCompleted: boolean;
  setDockOnboardingCompleted: () => void;
  resetOnboarding: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasDockOnboardingCompleted: false,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },
      setDockOnboardingCompleted: () =>
        set({ hasDockOnboardingCompleted: true }),
      resetOnboarding: () => set({ hasDockOnboardingCompleted: false }),
    }),
    {
      name: "meelio:local:onboarding",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      skipHydration: false,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
