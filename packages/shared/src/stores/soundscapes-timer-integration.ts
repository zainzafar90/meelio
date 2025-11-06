import { timerEvents } from "../utils/timer-events";
import { useSoundscapesStore } from "./soundscapes.store";
import { Category } from "../types/category";

type UnsubscribeFn = () => void;
type TimerEvent = {
  stage?: 'focus' | 'break';
  data?: {
    soundscapesEnabled?: boolean;
    nextStage?: 'focus' | 'break';
  };
};

const handleTimerStart = (event: TimerEvent) => {
  if (!event.data?.soundscapesEnabled) return;

  if (event.stage === 'focus') {
    const soundscapesState = useSoundscapesStore.getState();
    const hasPlayingSounds = soundscapesState.sounds.some(sound => sound.playing);

    if (hasPlayingSounds) {
      soundscapesState.resumePausedSounds();
    } else {
      soundscapesState.playCategory(Category.Productivity);
    }
  }
};

const handleTimerPause = (event: TimerEvent) => {
  if (!event.data?.soundscapesEnabled) return;
  useSoundscapesStore.getState().pausePlayingSounds();
};

const handleTimerComplete = (event: TimerEvent) => {
  if (!event.data?.soundscapesEnabled) return;

  if (event.data?.nextStage === 'break') {
    useSoundscapesStore.getState().pausePlayingSounds();
  }
};

const createState = () => {
  const state = {
    unsubscribe: null as UnsubscribeFn | null,
    isInitialized: false,
  };

  return {
    getUnsubscribe: () => state.unsubscribe,
    setUnsubscribe: (fn: UnsubscribeFn | null) => {
      state.unsubscribe = fn;
    },
    getIsInitialized: () => state.isInitialized,
    setIsInitialized: (value: boolean) => {
      state.isInitialized = value;
    },
  };
};

const state = createState();

export const initializeSoundscapesTimerIntegration = (): void => {
  if (state.getIsInitialized()) return;

  const unsubscribeStart = timerEvents.on('timer:start', handleTimerStart);
  const unsubscribePause = timerEvents.on('timer:pause', handleTimerPause);
  const unsubscribeComplete = timerEvents.on('timer:complete', handleTimerComplete);

  state.setUnsubscribe(() => {
    unsubscribeStart();
    unsubscribePause();
    unsubscribeComplete();
  });

  state.setIsInitialized(true);
};

export const cleanupSoundscapesTimerIntegration = (): void => {
  const unsubscribe = state.getUnsubscribe();
  if (unsubscribe) {
    unsubscribe();
    state.setUnsubscribe(null);
  }
  state.setIsInitialized(false);
};

