import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface DockIconsVisibility {
  timer: boolean;
  breathing: boolean;
  soundscapes: boolean;
  todos: boolean;
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
  isTodosVisible: boolean;
  isBackgroundsVisible: boolean;
  isSiteBlockerVisible: boolean;
  isTabStashVisible: boolean;

  // Icon visibility in dock (as a single object)
  dockIconsVisible: DockIconsVisibility;

  currentOnboardingStep: number;

  // Modal toggle functions
  toggleTimer: () => void;
  toggleBreathing: () => void;
  toggleGreetings: () => void;
  toggleSoundscapes: () => void;
  toggleTodos: () => void;
  toggleBackgrounds: () => void;
  toggleSiteBlocker: () => void;
  toggleTabStash: () => void;

  // Modal visibility setters
  setTimerVisible: (visible: boolean) => void;
  setBreathingVisible: (visible: boolean) => void;
  setGreetingsVisible: (visible: boolean) => void;
  setSoundscapesVisible: (visible: boolean) => void;
  setTodosVisible: (visible: boolean) => void;
  setBackgroundsVisible: (visible: boolean) => void;
  setSiteBlockerVisible: (visible: boolean) => void;
  setTabStashVisible: (visible: boolean) => void;

  // Icon visibility setters
  setDockIconVisible: (
    iconId: keyof DockIconsVisibility,
    visible: boolean
  ) => void;

  setCurrentOnboardingStep: (step: number) => void;
  reset: () => void;
}

export const useDockStore = create<DockState>()(
  persist(
    (set) => ({
      // Feature modal visibility state
      isTimerVisible: false,
      isBreathingVisible: false,
      isGreetingsVisible: true,
      isSoundscapesVisible: false,
      isTodosVisible: false,
      isBackgroundsVisible: false,
      isSiteBlockerVisible: false,
      isTabStashVisible: false,

      // Icon visibility in dock - all visible by default
      dockIconsVisible: {
        timer: true,
        breathing: true,
        soundscapes: true,
        todos: true,
        siteBlocker: true,
        tabStash: true,
        backgrounds: true,
        clock: false,
        calendar: true,
      },

      currentOnboardingStep: -1,

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

      toggleTodos: () => {
        set((state) => ({ isTodosVisible: !state.isTodosVisible }));
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

      setTodosVisible: (visible: boolean) => {
        set({ isTodosVisible: visible });
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

      reset: () => {
        set({
          // Reset modal visibility
          isTimerVisible: false,
          isBreathingVisible: false,
          isGreetingsVisible: true,
          isSoundscapesVisible: false,
          isTodosVisible: false,
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
      version: 1,
    }
  )
);
