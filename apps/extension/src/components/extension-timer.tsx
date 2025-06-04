import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PomodoroStage, formatTime, Icons, TimerStatsDialog, useDisclosure, PomodoroState, ConditionalFeature, TimerPlaceholder, NextPinnedTask, useSettingsStore } from "@repo/shared";

import { usePomodoroStore } from "@repo/shared";
import { Crown } from "lucide-react";

export const ExtensionTimer = () => {
  const { isOpen: isStatsDialogOpen, toggle: toggleStatsDialog } = useDisclosure();
  const { t } = useTranslation();
  const { openSettings, setTab } = useSettingsStore();
  const {
    activeStage,
    isRunning,
    endTimestamp,
    stageDurations,
    autoStartTimers,
    getDailyLimitStatus,
    stats,
    sessionCount,
  } = usePomodoroStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [remaining, setRemaining] = useState(stageDurations[activeStage]);

  const dailyLimitStatus = getDailyLimitStatus();

  const completeStage = async () => {
    const store = usePomodoroStore.getState();
    const finishedStage = store.activeStage;

    await store.completeSession();
    store.playCompletionSound();
    store.showCompletionNotification(finishedStage);

    store.advanceTimer();
    const newState = usePomodoroStore.getState();

    const duration = newState.stageDurations[newState.activeStage];
    chrome.runtime.sendMessage({ type: 'UPDATE_DURATION', duration });

    if (newState.isRunning) {
      chrome.runtime.sendMessage({ type: 'START', duration });
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
      !dailyLimitStatus.isLimitReached &&
      newState.getDailyLimitStatus().isLimitReached
    ) {
      toast.info(t("timer.limitReached.toast"), {
        description: t("timer.limitReached.description")
      });
    }
  };

  const getNextStage = (state: PomodoroState) => {
    if (state.activeStage === PomodoroStage.Focus) {
      return PomodoroStage.Break;
    }
    return PomodoroStage.Focus;
  };

  const handleStart = () => {
    if (dailyLimitStatus.isLimitReached) {
      toast.info(t("timer.limitReached.toast"), {
        description: t("timer.limitReached.description")
      });
      return;
    }

    setHasStarted(true);
    const store = usePomodoroStore.getState();
    const duration = store.stageDurations[activeStage];
    chrome.runtime.sendMessage({ type: 'START', duration });

    store.startTimer();
    usePomodoroStore.setState({
      endTimestamp: Date.now() + duration * 1000,
      lastUpdated: Date.now(),
    });
  };

  const handlePause = () => {
    chrome.runtime.sendMessage({ type: 'PAUSE' });
    const store = usePomodoroStore.getState();
    store.pauseTimer();
    usePomodoroStore.setState({ endTimestamp: null, lastUpdated: Date.now() });
  };

  const handleResume = () => {
    if (dailyLimitStatus.isLimitReached) {
      toast.info(t("timer.limitReached.toast"), {
        description: t("timer.limitReached.description")
      });
      return;
    }

    const store = usePomodoroStore.getState();
    store.resumeTimer();
    usePomodoroStore.setState({
      endTimestamp: Date.now() + remaining * 1000,
      lastUpdated: Date.now(),
    });
  };

  const handleReset = () => {
    chrome.runtime.sendMessage({ type: 'RESET' });
    const store = usePomodoroStore.getState();
    store.pauseTimer();
    usePomodoroStore.setState({
      endTimestamp: null,
      sessionCount: 0,
      activeStage,
      lastUpdated: Date.now(),
    });
    setHasStarted(false);
    setRemaining(stageDurations[PomodoroStage.Focus]);
  };

  const handleSwitch = () => {
    const store = usePomodoroStore.getState();
    const nextStage = getNextStage(store);
    chrome.runtime.sendMessage({ type: 'UPDATE_DURATION', duration: stageDurations[nextStage] });
    store.changeStage(nextStage);
    usePomodoroStore.setState({ endTimestamp: null, lastUpdated: Date.now() });
    setRemaining(stageDurations[nextStage]);
  };

  const handleSkipToNextStage = () => {
    const store = usePomodoroStore.getState();
    chrome.runtime.sendMessage({ type: 'SKIP_TO_NEXT_STAGE' });
    store.advanceTimer();
    const state = usePomodoroStore.getState();
    const duration = state.stageDurations[state.activeStage];
    chrome.runtime.sendMessage({ type: 'UPDATE_DURATION', duration });
    usePomodoroStore.setState({
      endTimestamp: state.isRunning ? Date.now() + duration * 1000 : null,
      lastUpdated: Date.now(),
    });
    setRemaining(duration);
  };

  useEffect(() => {
    const messageHandler = (msg: any) => {
      switch (msg.type) {
        case 'TICK':
          setIsLoading(false);
          setRemaining(msg.remaining);
          usePomodoroStore.getState().updateTimer(msg.remaining);
          break;
        case 'STAGE_COMPLETE':
          completeStage();
          break;
        case 'PAUSED':
          setRemaining(msg.remaining);
          usePomodoroStore.setState({
            isRunning: false,
            endTimestamp: null,
            lastUpdated: Date.now()
          });
          break;
        case 'RESET_COMPLETE':
          usePomodoroStore.setState({
            isRunning: false,
            endTimestamp: null,
            sessionCount: 0,
            activeStage,
            lastUpdated: Date.now()
          });
          setHasStarted(false);
          setRemaining(stageDurations[activeStage]);
          break;
      }
    };

    chrome.runtime.onMessage.addListener(messageHandler);
    return () => chrome.runtime.onMessage.removeListener(messageHandler);
  }, []);

  useEffect(() => {
    if (isRunning && endTimestamp) {
      const remainingTime = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
      if (remainingTime > 0) {
        chrome.runtime.sendMessage({ type: 'START', duration: remainingTime });
      } else {
        chrome.runtime.sendMessage({ type: 'STAGE_COMPLETE' });
      }
    }
  }, [isRunning, endTimestamp, activeStage, stageDurations, autoStartTimers]);

  useEffect(() => {
    if (isLoading) return;

    const emoji = activeStage === PomodoroStage.Focus ? '🎯' : '☕';
    const timeStr = formatTime(remaining);
    const mode = activeStage === PomodoroStage.Focus ? 'Focus' : 'Break';

    document.title = isRunning ? `${emoji} ${timeStr} - ${mode}` : 'Meelio - focus, calm, & productivity';
  }, [remaining, activeStage, isRunning, stageDurations, isLoading]);

  // Auto-pause timer when daily limit is reached
  useEffect(() => {
    if (isRunning && dailyLimitStatus.isLimitReached) {
      handlePause();
      toast.info(t("timer.limitReached.toast"), {
        description: t("timer.limitReached.description")
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyLimitStatus.isLimitReached, isRunning]);


  useEffect(() => {
    if (!isRunning && !hasStarted) {
      setRemaining(stageDurations[activeStage]);
    }
  }, [activeStage, stageDurations, isRunning, hasStarted]);

  useEffect(() => {
    if (stats.todaysFocusTime === 0 && stats.todaysFocusSessions === 0 && sessionCount === 0) {
      setHasStarted(false);
      setRemaining(stageDurations[activeStage]);
      chrome.runtime.sendMessage({ type: 'RESET' });
    }
  }, [stats.todaysFocusTime, stats.todaysFocusSessions, sessionCount, stageDurations, activeStage]);

  return (
    <div className="relative">
      <ConditionalFeature
        showFallback={dailyLimitStatus.isLimitReached}
        fallback={
          <TimerPlaceholder activeStage={activeStage} />
        }
      >
        <div className="max-w-full w-72 sm:w-[400px] backdrop-blur-xl bg-white/5 rounded-3xl shadow-lg text-white">
          <div className="p-6 space-y-10">
          {/* Timer Mode Tabs */}
          <div className="w-full">
            <div className="w-full h-12 rounded-full bg-gray-100/10 text-black p-1 flex">
              <button
                onClick={() => {
                  if (dailyLimitStatus.isLimitReached) {
                    return;
                  }
                  handleSwitch();
                }}
                disabled={dailyLimitStatus.isLimitReached}
                className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                  activeStage === PomodoroStage.Focus ? 'bg-white/50' : ''
                } ${
                  dailyLimitStatus.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={dailyLimitStatus.isLimitReached ? t("timer.limitReached.title") : t("timer.controls.focusMode")}
              >
                <span>Focus</span>
              </button>
              <button
                onClick={() => {
                  if (dailyLimitStatus.isLimitReached) {
                    return;
                  }
                  if (activeStage === PomodoroStage.Focus) {
                    handleSwitch();
                  }
                }}
                disabled={activeStage === PomodoroStage.Break || dailyLimitStatus.isLimitReached}
                className={`flex-1 rounded-full flex items-center justify-center gap-2 transition-colors text-sm ${
                  activeStage === PomodoroStage.Break ? 'bg-white/50' : ''
                } ${
                  activeStage === PomodoroStage.Break || dailyLimitStatus.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={dailyLimitStatus.isLimitReached ? t("timer.limitReached.title") : t("timer.controls.breakMode")}
              >
                <span>Break</span>
              </button>
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-normal">
              {isLoading ? <TimeSkeleton /> : formatTime(remaining)}
            </div>
            <NextPinnedTask />
          </div>

          <div className="flex flex-col gap-4">
            {/* Control Buttons */}
            <div className="flex items-center justify-between gap-4">
              <button
                className={`cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm ${
                  dailyLimitStatus.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => {
                  if (dailyLimitStatus.isLimitReached) {
                    return;
                  }
                  handleReset();
                }}
                disabled={dailyLimitStatus.isLimitReached}
                title={dailyLimitStatus.isLimitReached ? t("timer.limitReached.title") : t("timer.controls.reset")}
                role="button"
              >
                <Icons.resetTimer className="size-4 text-white/90" />
                <span className="sr-only">{t("timer.controls.reset")}</span>
              </button>

              <button
                className={`cursor-pointer relative flex h-10 w-full items-center justify-center rounded-full shadow-lg bg-gradient-to-b from-zinc-800 to-zinc-900 text-white/90 backdrop-blur-sm ${
                  dailyLimitStatus.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => {
                  if (dailyLimitStatus.isLimitReached) {
                    return;
                  }
                  
                  if (isRunning) {
                    handlePause();
                  } else if (hasStarted) {
                    handleResume();
                  } else {
                    handleStart();
                  }
                }}
                disabled={dailyLimitStatus.isLimitReached}
                title={dailyLimitStatus.isLimitReached ? t("timer.limitReached.title") : t("timer.controls.startStop")}
                role="button"
              >
                {dailyLimitStatus.isLimitReached ? (
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
                  dailyLimitStatus.isLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => {
                  if (dailyLimitStatus.isLimitReached) {
                    return;
                  }
                  handleSkipToNextStage();
                }}
                disabled={dailyLimitStatus.isLimitReached}
                title={dailyLimitStatus.isLimitReached ? t("timer.limitReached.title") : t("timer.controls.skipStage")}
                role="button"
              >
                <Icons.forward className="size-4 text-white/90" />
                <span className="sr-only">{t("timer.controls.skipStage")}</span>
              </button>

              <button
                className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm"
                onClick={toggleStatsDialog}
                title={t("timer.stats.title")}
                role="button"
              >
                <Icons.graph className="size-4 text-white/90" />
                <span className="sr-only">{t("timer.stats.title")}</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-200/20 rounded-full">
              <div
                className="h-full bg-gray-100 rounded-full transition-all"
                style={{
                  width: `${(remaining / stageDurations[activeStage]) * 100}%`
                }}
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
        isOpen={isStatsDialogOpen}
        onOpenChange={toggleStatsDialog}
        onSettingsClick={() => {
          toggleStatsDialog();
          setTab("timer");
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
      transition={{
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    >
      {/* Hours */}
      <div className="h-12 w-12 sm:w-[72px] sm:h-[72px] md:w-32 md:h-32 bg-white/80 rounded-lg backdrop-blur-sm" />

      {/* Colon */}
      <div className="flex flex-col gap-2">
        <div className="h-1.5 w-1.5 sm:w-4 sm:h-4 bg-white/80 rounded-full backdrop-blur-sm" />
        <div className="h-1.5 w-1.5 sm:w-4 sm:h-4 bg-white/80 rounded-full backdrop-blur-sm" />
      </div>

      {/* Minutes */}
      <div className="h-12 w-12 sm:w-[72px] sm:h-[72px] md:w-32 md:h-32 bg-white/80 rounded-lg backdrop-blur-sm" />
    </motion.div>
  )
}