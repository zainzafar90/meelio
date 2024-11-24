import { create } from "zustand";

interface DockState {
  isTimerVisible: boolean;
  isBreathingVisible: boolean;
  isGreetingsVisible: boolean;
  isSoundscapesVisible: boolean;
  isTodosVisible: boolean;
  toggleTimer: () => void;
  toggleBreathing: () => void;
  toggleGreetings: () => void;
  toggleSoundscapes: () => void;
  toggleTodos: () => void;
  setTimerVisible: (visible: boolean) => void;
  setBreathingVisible: (visible: boolean) => void;
  setGreetingsVisible: (visible: boolean) => void;
  setSoundscapesVisible: (visible: boolean) => void;
  setTodosVisible: (visible: boolean) => void;
  reset: () => void;
}

export const useDockStore = create<DockState>()((set) => ({
  isTimerVisible: true,
  isBreathingVisible: false,
  isGreetingsVisible: true,
  isSoundscapesVisible: false,
  isTodosVisible: false,

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

  toggleGreetings: () => {
    set((state) => ({ isGreetingsVisible: !state.isGreetingsVisible }));
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

  reset: () => {
    set({
      isTimerVisible: false,
      isBreathingVisible: false,
      isGreetingsVisible: true,
      isSoundscapesVisible: false,
      isTodosVisible: false,
    });
  },
}));
