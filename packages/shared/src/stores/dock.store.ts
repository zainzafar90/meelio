import { create } from "zustand";

interface DockState {
  isTimerVisible: boolean;
  isBreathingVisible: boolean;
  isGreetingsVisible: boolean;
  isSoundscapesVisible: boolean;
  isTodosVisible: boolean;
  isBackgroundsVisible: boolean;
  isSiteBlockerVisible: boolean;
  isTabStashVisible: boolean;
  isTimerIconVisible: boolean;
  isBreathingIconVisible: boolean;
  isSoundscapesIconVisible: boolean;
  isTodosIconVisible: boolean;
  isSiteBlockerIconVisible: boolean;
  isTabStashIconVisible: boolean;
  isBackgroundsIconVisible: boolean;
  currentOnboardingStep: number;
  toggleTimer: () => void;
  toggleBreathing: () => void;
  toggleGreetings: () => void;
  toggleSoundscapes: () => void;
  toggleTodos: () => void;
  toggleBackgrounds: () => void;
  toggleSiteBlocker: () => void;
  toggleTabStash: () => void;
  setTimerVisible: (visible: boolean) => void;
  setBreathingVisible: (visible: boolean) => void;
  setGreetingsVisible: (visible: boolean) => void;
  setSoundscapesVisible: (visible: boolean) => void;
  setTodosVisible: (visible: boolean) => void;
  setBackgroundsVisible: (visible: boolean) => void;
  setSiteBlockerVisible: (visible: boolean) => void;
  setTabStashVisible: (visible: boolean) => void;
  setTimerIconVisible: (visible: boolean) => void;
  setBreathingIconVisible: (visible: boolean) => void;
  setSoundscapesIconVisible: (visible: boolean) => void;
  setTodosIconVisible: (visible: boolean) => void;
  setSiteBlockerIconVisible: (visible: boolean) => void;
  setTabStashIconVisible: (visible: boolean) => void;
  setBackgroundsIconVisible: (visible: boolean) => void;
  setCurrentOnboardingStep: (step: number) => void;
  reset: () => void;
}

export const useDockStore = create<DockState>()((set) => ({
  isTimerVisible: false,
  isBreathingVisible: false,
  isGreetingsVisible: true,
  isSoundscapesVisible: false,
  isTodosVisible: false,
  isBackgroundsVisible: false,
  isSiteBlockerVisible: false,
  isTabStashVisible: false,
  isTimerIconVisible: true,
  isBreathingIconVisible: true,
  isSoundscapesIconVisible: true,
  isTodosIconVisible: true,
  isSiteBlockerIconVisible: true,
  isTabStashIconVisible: true,
  isBackgroundsIconVisible: true,
  currentOnboardingStep: -1,

  toggleTimer: () => {
    set((state) => {
      return { isTimerVisible: !state.isTimerVisible };
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

  setTimerIconVisible: (visible: boolean) => {
    set({ isTimerIconVisible: visible });
  },

  setBreathingIconVisible: (visible: boolean) => {
    set({ isBreathingIconVisible: visible });
  },

  setSoundscapesIconVisible: (visible: boolean) => {
    set({ isSoundscapesIconVisible: visible });
  },

  setTodosIconVisible: (visible: boolean) => {
    set({ isTodosIconVisible: visible });
  },

  setSiteBlockerIconVisible: (visible: boolean) => {
    set({ isSiteBlockerIconVisible: visible });
  },

  setTabStashIconVisible: (visible: boolean) => {
    set({ isTabStashIconVisible: visible });
  },

  setBackgroundsIconVisible: (visible: boolean) => {
    set({ isBackgroundsIconVisible: visible });
  },

  setCurrentOnboardingStep: (step: number) => {
    set({ currentOnboardingStep: step });
  },

  reset: () => {
    set({
      isTimerVisible: false,
      isBreathingVisible: false,
      isGreetingsVisible: true,
      isSoundscapesVisible: false,
      isTodosVisible: false,
      isBackgroundsVisible: false,
      isSiteBlockerVisible: false,
      isTabStashVisible: false,
      currentOnboardingStep: -1,
    });
  },
}));
