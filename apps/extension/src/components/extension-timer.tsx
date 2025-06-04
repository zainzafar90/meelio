import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  ConditionalFeature,
  NextPinnedTask,
  PomodoroStage,
  TimerPlaceholder,
  TimerStatsDialog,
  formatTime,
  useDisclosure,
  usePomodoroStore,
  useSettingsStore,
  Icons,
} from '@repo/shared';
import { Crown } from 'lucide-react';
import type { TimerEvent, TimerMessage } from '../types';

interface UseTimerResult {
  remaining: number;
  isLoading: boolean;
  isRunning: boolean;
  hasStarted: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  switchStage: () => void;
}

function send(msg: TimerMessage) {
  chrome.runtime.sendMessage(msg);
}

function useBackgroundTimer(): UseTimerResult {
  const store = usePomodoroStore();
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [remaining, setRemaining] = useState(
    store.stageDurations[store.activeStage],
  );
  const dailyLimit = store.getDailyLimitStatus();

  const start = () => {
    if (dailyLimit.isLimitReached) {
      toast.info('Timer limit reached');
      return;
    }
    const duration = store.stageDurations[store.activeStage];
    send({ type: 'START', duration });
    store.startTimer();
    usePomodoroStore.setState({
      endTimestamp: Date.now() + duration * 1000,
      lastUpdated: Date.now(),
    });
    setHasStarted(true);
  };

  const pause = () => {
    send({ type: 'PAUSE' });
    store.pauseTimer();
    usePomodoroStore.setState({ endTimestamp: null, lastUpdated: Date.now() });
  };

  const resume = () => {
    if (dailyLimit.isLimitReached) {
      toast.info('Timer limit reached');
      return;
    }
    send({ type: 'START', duration: remaining });
    store.resumeTimer();
    usePomodoroStore.setState({
      endTimestamp: Date.now() + remaining * 1000,
      lastUpdated: Date.now(),
    });
  };

  const reset = () => {
    send({ type: 'RESET' });
    store.pauseTimer();
    usePomodoroStore.setState({
      endTimestamp: null,
      sessionCount: 0,
      activeStage: store.activeStage,
      lastUpdated: Date.now(),
    });
    setHasStarted(false);
    setRemaining(store.stageDurations[PomodoroStage.Focus]);
  };

  const switchStage = () => {
    const nextStage =
      store.activeStage === PomodoroStage.Focus
        ? PomodoroStage.Break
        : PomodoroStage.Focus;
    send({ type: 'RESET' });
    send({ type: 'UPDATE_DURATION', duration: store.stageDurations[nextStage] });
    store.changeStage(nextStage);
    usePomodoroStore.setState({ endTimestamp: null, lastUpdated: Date.now() });
    setHasStarted(false);
    setRemaining(store.stageDurations[nextStage]);
  };

  const skip = () => {
    send({ type: 'SKIP_TO_NEXT_STAGE' });
    store.advanceTimer();
    const state = usePomodoroStore.getState();
    const duration = state.stageDurations[state.activeStage];
    send({ type: 'UPDATE_DURATION', duration });
    usePomodoroStore.setState({
      endTimestamp: state.isRunning ? Date.now() + duration * 1000 : null,
      lastUpdated: Date.now(),
    });
    setRemaining(duration);
  };

  const completeStage = async () => {
    const finishedStage = store.activeStage;
    await store.completeSession();
    store.playCompletionSound();
    store.showCompletionNotification(finishedStage);
    store.advanceTimer();
    const newState = usePomodoroStore.getState();
    const duration = newState.stageDurations[newState.activeStage];
    send({ type: 'UPDATE_DURATION', duration });
    if (newState.isRunning) {
      send({ type: 'START', duration });
      usePomodoroStore.setState({
        endTimestamp: Date.now() + duration * 1000,
        lastUpdated: Date.now(),
      });
    } else {
      usePomodoroStore.setState({ endTimestamp: null, lastUpdated: Date.now() });
      setRemaining(duration);
    }
    if (
      finishedStage === PomodoroStage.Focus &&
      !dailyLimit.isLimitReached &&
      newState.getDailyLimitStatus().isLimitReached
    ) {
      toast.info('Timer limit reached');
    }
  };

  useEffect(() => {
    const handler = (msg: TimerEvent) => {
      switch (msg.type) {
        case 'TICK':
          setIsLoading(false);
          setRemaining(msg.remaining);
          break;
        case 'STAGE_COMPLETE':
          completeStage();
          break;
        case 'PAUSED':
          setRemaining(msg.remaining);
          usePomodoroStore.setState({
            isRunning: false,
            endTimestamp: null,
            lastUpdated: Date.now(),
          });
          break;
        case 'RESET_COMPLETE':
          usePomodoroStore.setState({
            isRunning: false,
            endTimestamp: null,
            sessionCount: 0,
            activeStage: store.activeStage,
            lastUpdated: Date.now(),
          });
          setHasStarted(false);
          setRemaining(store.stageDurations[store.activeStage]);
          break;
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [store.activeStage, store.stageDurations]);

  useEffect(() => {
    if (store.isRunning && store.endTimestamp) {
      const left = Math.max(0, Math.floor((store.endTimestamp - Date.now()) / 1000));
      if (left > 0) send({ type: 'START', duration: left });
      else send({ type: 'STAGE_COMPLETE' });
    }
  }, [store.isRunning, store.endTimestamp]);

  useEffect(() => {
    if (!store.isRunning && !hasStarted) {
      setRemaining(store.stageDurations[store.activeStage]);
    }
  }, [store.activeStage, store.stageDurations, store.isRunning, hasStarted]);

  return {
    remaining,
    isLoading,
    isRunning: store.isRunning,
    hasStarted,
    start,
    pause,
    resume,
    reset,
    skip,
    switchStage,
  };
}

export const ExtensionTimer = () => {
  const { isOpen, toggle } = useDisclosure();
  const { t } = useTranslation();
  const { openSettings, setTab } = useSettingsStore();
  const {
    remaining,
    isRunning,
    hasStarted,
    start,
    pause,
    resume,
    reset,
    skip,
    switchStage,
    isLoading,
  } = useBackgroundTimer();
  const activeStage = usePomodoroStore((s) => s.activeStage);
  const stageDurations = usePomodoroStore((s) => s.stageDurations);
  const dailyLimit = usePomodoroStore((s) => s.getDailyLimitStatus());

  useEffect(() => {
    const emoji = activeStage === PomodoroStage.Focus ? '🎯' : '☕';
    const timeStr = formatTime(remaining);
    const mode = activeStage === PomodoroStage.Focus ? 'Focus' : 'Break';
    document.title = isRunning
      ? `${emoji} ${timeStr} - ${mode}`
      : 'Meelio - focus, calm, & productivity';
  }, [remaining, activeStage, isRunning, isLoading]);

  return (
    <div className="relative">
      <ConditionalFeature
        key={`timer-${stageDurations[activeStage]}-${activeStage}`}
        showFallback={dailyLimit.isLimitReached}
        fallback={<TimerPlaceholder activeStage={activeStage} />}
      >
        <div className="max-w-full w-72 sm:w-[400px] backdrop-blur-xl bg-white/5 rounded-3xl shadow-lg text-white">
          <div className="p-6 space-y-10">
            <div className="w-full">
              <div className="w-full h-12 rounded-full bg-gray-100/10 text-black p-1 flex">
                <button
                  onClick={() => {
                    if (!dailyLimit.isLimitReached) switchStage();
                  }}
                  disabled={dailyLimit.isLimitReached}
                  className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                    activeStage === PomodoroStage.Focus ? 'bg-white/50' : ''
                  } ${dailyLimit.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={dailyLimit.isLimitReached ? t('timer.limitReached.title') : t('timer.controls.focusMode')}
                >
                  <span>Focus</span>
                </button>
                <button
                  onClick={() => {
                    if (!dailyLimit.isLimitReached && activeStage === PomodoroStage.Focus) switchStage();
                  }}
                  disabled={activeStage === PomodoroStage.Break || dailyLimit.isLimitReached}
                  className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                    activeStage === PomodoroStage.Break ? 'bg-white/50' : ''
                  } ${
                    activeStage === PomodoroStage.Break || dailyLimit.isLimitReached
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  title={dailyLimit.isLimitReached ? t('timer.limitReached.title') : t('timer.controls.breakMode')}
                >
                  <span>Break</span>
                </button>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-normal">
                {isLoading ? <TimeSkeleton /> : formatTime(remaining)}
              </div>
              <NextPinnedTask />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <button
                  className={`cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm ${
                    dailyLimit.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => {
                    if (!dailyLimit.isLimitReached) reset();
                  }}
                  disabled={dailyLimit.isLimitReached}
                  title={dailyLimit.isLimitReached ? t('timer.limitReached.title') : t('timer.controls.reset')}
                  role="button"
                >
                  <Icons.resetTimer className="size-4 text-white/90" />
                  <span className="sr-only">{t('timer.controls.reset')}</span>
                </button>

                <button
                  className={`cursor-pointer relative flex h-10 w-full items-center justify-center rounded-full shadow-lg bg-gradient-to-b from-zinc-800 to-zinc-900 text-white/90 backdrop-blur-sm ${
                    dailyLimit.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => {
                    if (dailyLimit.isLimitReached) return;
                    if (isRunning) pause();
                    else if (hasStarted) resume();
                    else start();
                  }}
                  disabled={dailyLimit.isLimitReached}
                  title={dailyLimit.isLimitReached ? t('timer.limitReached.title') : t('timer.controls.startStop')}
                  role="button"
                >
                  {dailyLimit.isLimitReached ? (
                    <>
                      <Crown className="size-4" />
                      <span className="ml-2 uppercase text-xs sm:text-sm md:text-base">Upgrade</span>
                    </>
                  ) : (
                    <>
                      {isRunning ? <Icons.pause className="size-4" /> : <Icons.play className="size-4" />}
                      <span className="ml-2 uppercase text-xs sm:text-sm md:text-base">
                        {isRunning ? t('common.actions.stop') : hasStarted ? 'Resume' : t('common.actions.start')}
                      </span>
                    </>
                  )}
                </button>

                <button
                  className={`cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm ${
                    dailyLimit.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => {
                    if (!dailyLimit.isLimitReached) skip();
                  }}
                  disabled={dailyLimit.isLimitReached}
                  title={dailyLimit.isLimitReached ? t('timer.limitReached.title') : t('timer.controls.skipStage')}
                  role="button"
                >
                  <Icons.forward className="size-4 text-white/90" />
                  <span className="sr-only">{t('timer.controls.skipStage')}</span>
                </button>

                <button
                  className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm"
                  onClick={toggle}
                  title={t('timer.stats.title')}
                  role="button"
                >
                  <Icons.graph className="size-4 text-white/90" />
                  <span className="sr-only">{t('timer.stats.title')}</span>
                </button>
              </div>

              <div className="h-1.5 bg-gray-200/20 rounded-full">
                <div
                  className="h-full bg-gray-100 rounded-full transition-all"
                  style={{ width: `${(remaining / stageDurations[activeStage]) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={(remaining / stageDurations[activeStage]) * 100}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          </div>
        </div>
      </ConditionalFeature>

      <TimerStatsDialog
        isOpen={isOpen}
        onOpenChange={toggle}
        onSettingsClick={() => {
          toggle();
          setTab('timer');
          openSettings();
        }}
      />
    </div>
  );
};

function TimeSkeleton() {
  return (
    <motion.div
      className="flex items-center justify-center gap-2"
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
    >
      <div className="h-12 w-12 sm:w-[72px] sm:h-[72px] md:w-32 md:h-32 bg-white/80 rounded-lg backdrop-blur-sm" />
      <div className="flex flex-col gap-2">
        <div className="h-1.5 w-1.5 sm:w-4 sm:h-4 bg-white/80 rounded-full backdrop-blur-sm" />
        <div className="h-1.5 w-1.5 sm:w-4 sm:h-4 bg-white/80 rounded-full backdrop-blur-sm" />
      </div>
      <div className="h-12 w-12 sm:w-[72px] sm:h-[72px] md:w-32 md:h-32 bg-white/80 rounded-lg backdrop-blur-sm" />
    </motion.div>
  );
}
