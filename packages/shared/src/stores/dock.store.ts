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
  notes?: boolean;
  bookmarks?: boolean;
  weather?: boolean;
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
  isCalendarVisible: boolean;
  isNotesVisible?: boolean;
  isBookmarksVisible?: boolean;
  isWeatherVisible?: boolean;

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
  toggleCalendar: () => void;
  toggleNotes?: () => void;
  toggleBookmarks?: () => void;
  toggleWeather?: () => void;

  // Modal visibility setters
  setTimerVisible: (visible: boolean) => void;
  setBreathingVisible: (visible: boolean) => void;
  setGreetingsVisible: (visible: boolean) => void;
  setSoundscapesVisible: (visible: boolean) => void;
  setTasksVisible: (visible: boolean) => void;
  setBackgroundsVisible: (visible: boolean) => void;
  setSiteBlockerVisible: (visible: boolean) => void;
  setTabStashVisible: (visible: boolean) => void;
  setCalendarVisible: (visible: boolean) => void;
  setNotesVisible?: (visible: boolean) => void;
  setBookmarksVisible?: (visible: boolean) => void;
  setWeatherVisible?: (visible: boolean) => void;

  // Icon visibility setters
  setDockIconVisible: (
    iconId: keyof DockIconsVisibility,
    visible: boolean
  ) => void;

  setCurrentOnboardingStep: (step: number) => void;
  setShowIconLabels: (visible: boolean) => void;
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
      isTasksVisible: false,
      isNotesVisible: false,
      isBackgroundsVisible: false,
      isSiteBlockerVisible: false,
      isTabStashVisible: false,
      isCalendarVisible: false,
      isBookmarksVisible: false,
      isWeatherVisible: false,

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
        notes: true,
        bookmarks: true,
        weather: true,
      },

      showIconLabels: false,

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

      toggleCalendar: () => {
        set((state) => ({ isCalendarVisible: !state.isCalendarVisible }));
      },

      toggleNotes: () => {
        set((state) => ({ isNotesVisible: !(state as any).isNotesVisible }));
      },

      toggleBookmarks: () => {
        set((state) => ({ isBookmarksVisible: !(state as any).isBookmarksVisible }));
      },

      toggleWeather: () => {
        set((state) => ({ isWeatherVisible: !(state as any).isWeatherVisible }));
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

      setCalendarVisible: (visible: boolean) => {
        set({ isCalendarVisible: visible });
      },

      setNotesVisible: (visible: boolean) => {
        set({ isNotesVisible: visible } as any);
      },

      setBookmarksVisible: (visible: boolean) => {
        set({ isBookmarksVisible: visible } as any);
      },

      setWeatherVisible: (visible: boolean) => {
        set({ isWeatherVisible: visible } as any);
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
          isTimerVisible: false,
          isBreathingVisible: false,
          isGreetingsVisible: true,
          isSoundscapesVisible: false,
          isTasksVisible: false,
          isBackgroundsVisible: false,
          isSiteBlockerVisible: false,
          isTabStashVisible: false,
          isCalendarVisible: false,
          isNotesVisible: false,
          isBookmarksVisible: false,
          isWeatherVisible: false,

          // Don't reset icon visibility on reset
          currentOnboardingStep: -1,
        });
      },
    }),
    {
      name: "meelio:local:dock",
      storage: createJSONStorage(() => localStorage),
      version: 5,
      migrate: (persistedState: any, _version: number) => {
        const state = { ...persistedState };
        state.dockIconsVisible = state.dockIconsVisible || {};
        if (state.dockIconsVisible.notes === undefined) {
          state.dockIconsVisible.notes = true;
        }
        if (state.isNotesVisible === undefined) {
          state.isNotesVisible = false;
        }
        if (state.dockIconsVisible.bookmarks === undefined) {
          state.dockIconsVisible.bookmarks = true;
        }
        if (state.isBookmarksVisible === undefined) {
          state.isBookmarksVisible = false;
        }
        if (state.dockIconsVisible.weather === undefined) {
          state.dockIconsVisible.weather = true;
        }
        if (state.isWeatherVisible === undefined) {
          state.isWeatherVisible = false;
        }
        return state;
      },
      partialize: (state) => ({
        isTimerVisible: state.isTimerVisible,
        isBreathingVisible: state.isBreathingVisible,
        isGreetingsVisible: state.isGreetingsVisible,
        dockIconsVisible: state.dockIconsVisible,
        currentOnboardingStep: state.currentOnboardingStep,
        showIconLabels: state.showIconLabels,
      }),
    }
  )
);
