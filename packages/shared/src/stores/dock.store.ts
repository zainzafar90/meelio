import { create } from "zustand";

import { createJSONStorage, persist } from "zustand/middleware";

interface DockIconsVisibility {
  timer: boolean;
  breathing: boolean;
  soundscapes: boolean;
  tasks: boolean;
  siteBlocker: boolean;
  tabStash: boolean;
  backgrounds: boolean;
  clock: boolean;
  calendar: boolean;
}

interface DockState {
  // Feature modal visibility state
  isTimerVisible: boolean;
  isBreathingVisible: boolean;
  isGreetingsVisible: boolean;
  isSoundscapesVisible: boolean;
  isTasksVisible: boolean;
  isBackgroundsVisible: boolean;
  isSiteBlockerVisible: boolean;
  isTabStashVisible: boolean;

  // Icon visibility in dock (as a single object)
  dockIconsVisible: DockIconsVisibility;

  currentOnboardingStep: number;

  showIconLabels: boolean;

  // Modal toggle functions
  toggleTimer: () => void;
  toggleBreathing: () => void;
  toggleGreetings: () => void;
  toggleSoundscapes: () => void;
  toggleTasks: () => void;
  toggleBackgrounds: () => void;
  toggleSiteBlocker: () => void;
  toggleTabStash: () => void;

  // Modal visibility setters
  setTimerVisible: (visible: boolean) => void;
  setBreathingVisible: (visible: boolean) => void;
  setGreetingsVisible: (visible: boolean) => void;
  setSoundscapesVisible: (visible: boolean) => void;
  setTasksVisible: (visible: boolean) => void;
  setBackgroundsVisible: (visible: boolean) => void;
  setSiteBlockerVisible: (visible: boolean) => void;
  setTabStashVisible: (visible: boolean) => void;

  // Icon visibility setters
  setDockIconVisible: (
    iconId: keyof DockIconsVisibility,
    visible: boolean
  ) => void;

  setCurrentOnboardingStep: (step: number) => void;
  setShowIconLabels: (visible: boolean) => void;
  reset: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useDockStore = create<DockState>()(
  persist(
    (set) => ({
      // Feature modal visibility state
      isTimerVisible: false,
      isBreathingVisible: false,
      isGreetingsVisible: true,
      isSoundscapesVisible: false,
      isTasksVisible: false,
      isBackgroundsVisible: false,
      isSiteBlockerVisible: false,
      isTabStashVisible: false,

      // Icon visibility in dock - all visible by default
      dockIconsVisible: {
        timer: true,
        breathing: true,
        soundscapes: true,
        tasks: true,
        siteBlocker: true,
        tabStash: true,
        backgrounds: true,
        clock: false,
        calendar: true,
      },

      showIconLabels: false,

      currentOnboardingStep: -1,

      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },

      // Modal toggle functions
      toggleTimer: () => {
        set((state) => {
          return {
            isTimerVisible: !state.isTimerVisible,
            isBreathingVisible: false,
            isGreetingsVisible: state.isTimerVisible ? false : true,
          };
        });
      },

      toggleBreathing: () => {
        set((state) => ({
          isBreathingVisible: !state.isBreathingVisible,
          isTimerVisible: false,
          isGreetingsVisible: state.isBreathingVisible ? true : false,
        }));
      },

      toggleSoundscapes: () => {
        set((state) => ({ isSoundscapesVisible: !state.isSoundscapesVisible }));
      },

      toggleTasks: () => {
        set((state) => ({ isTasksVisible: !state.isTasksVisible }));
      },

      toggleBackgrounds: () => {
        set((state) => ({ isBackgroundsVisible: !state.isBackgroundsVisible }));
      },

      toggleGreetings: () => {
        set((state) => ({ isGreetingsVisible: !state.isGreetingsVisible }));
      },

      toggleSiteBlocker: () => {
        set((state) => ({ isSiteBlockerVisible: !state.isSiteBlockerVisible }));
      },

      toggleTabStash: () => {
        set((state) => ({ isTabStashVisible: !state.isTabStashVisible }));
      },

      // Modal visibility setters
      setTimerVisible: (visible: boolean) => {
        set({ isTimerVisible: visible });
      },

      setBreathingVisible: (visible: boolean) => {
        set({ isBreathingVisible: visible });
      },

      setGreetingsVisible: (visible: boolean) => {
        set({ isGreetingsVisible: visible });
      },

      setSoundscapesVisible: (visible: boolean) => {
        set({ isSoundscapesVisible: visible });
      },

      setTasksVisible: (visible: boolean) => {
        set({ isTasksVisible: visible });
      },

      setBackgroundsVisible: (visible: boolean) => {
        set({ isBackgroundsVisible: visible });
      },

      setSiteBlockerVisible: (visible: boolean) => {
        set({ isSiteBlockerVisible: visible });
      },

      setTabStashVisible: (visible: boolean) => {
        set({ isTabStashVisible: visible });
      },

      // Icon visibility setter
      setDockIconVisible: (
        iconId: keyof DockIconsVisibility,
        visible: boolean
      ) => {
        set((state) => ({
          dockIconsVisible: {
            ...state.dockIconsVisible,
            [iconId]: visible,
          },
        }));
      },

      setCurrentOnboardingStep: (step: number) => {
        set({ currentOnboardingStep: step });
      },

      setShowIconLabels: (visible: boolean) => {
        set({ showIconLabels: visible });
      },

      reset: () => {
        set({
          // Reset modal visibility
          isTimerVisible: false,
          isBreathingVisible: false,
          isGreetingsVisible: true,
          isSoundscapesVisible: false,
          isTasksVisible: false,
          isBackgroundsVisible: false,
          isSiteBlockerVisible: false,
          isTabStashVisible: false,

          // Don't reset icon visibility on reset
          currentOnboardingStep: -1,
        });
      },
    }),
    {
      name: "meelio:local:dock",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (state) => ({
        isTimerVisible: state.isTimerVisible,
        isBreathingVisible: state.isBreathingVisible,
        isGreetingsVisible: state.isGreetingsVisible,
        dockIconsVisible: state.dockIconsVisible,
        currentOnboardingStep: state.currentOnboardingStep,
        showIconLabels: state.showIconLabels,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
