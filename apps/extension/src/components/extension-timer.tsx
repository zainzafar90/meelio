import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PomodoroStage, addPomodoroSession, addPomodoroSummary, formatTime, Icons, TimerStatsDialog, useDisclosure, PomodoroState, TimerSettingsDialog, ConditionalFeature, TimerPlaceholder } from "@repo/shared";

import { usePomodoroStore } from "@repo/shared";
import { Crown } from "lucide-react";

export const ExtensionTimer = () => {
  const { isOpen: isStatsDialogOpen, toggle: toggleStatsDialog } = useDisclosure();
  const { isOpen: isSettingsDialogOpen, toggle: toggleSettingsDialog } = useDisclosure();
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
    const state = usePomodoroStore.getState();
    const completedStage = state.activeStage;
    const newStats = { ...state.stats };
    const isFocus = completedStage === PomodoroStage.Focus;

    if (isFocus) {
      newStats.todaysFocusSessions += 1;
      newStats.todaysFocusTime += state.stageDurations[PomodoroStage.Focus];
    } else if (completedStage === PomodoroStage.Break) {
      newStats.todaysBreaks += 1;
      newStats.todaysBreakTime += state.stageDurations[PomodoroStage.Break];
    }

    const nextStage = getNextStage(state);
    const newSessionCount = isFocus ? state.sessionCount + 1 : state.sessionCount;
    const duration = state.stageDurations[nextStage];

    usePomodoroStore.setState({
      stats: newStats,
      activeStage: nextStage,
      sessionCount: newSessionCount,
      isRunning: autoStartTimers ? true : false,
      endTimestamp: autoStartTimers ? Date.now() + duration * 1000 : null,
      lastUpdated: Date.now()
    });

     // Check if daily limit was reached after this focus session
     if (isFocus) {
      const updatedState = usePomodoroStore.getState();
      const updatedLimitStatus = updatedState.getDailyLimitStatus();
      if (updatedLimitStatus.isLimitReached && !dailyLimitStatus.isLimitReached) {
        toast.info("Daily 90-minute limit reached!", {
          description: "Great work today! Upgrade to Pro for unlimited time."
        });
      }
    }

    if (nextStage !== completedStage) {
      chrome.runtime.sendMessage({
        type: "UPDATE_DURATION",
        duration
      });
    }

    const sessionData = {
      timestamp: Date.now(),
      stage: completedStage,
      duration: state.stageDurations[completedStage],
      completed: true,
    };

    try {
      await addPomodoroSession(sessionData);
      await addPomodoroSummary(state.stageDurations[completedStage], completedStage);
    } catch (error) {
      console.error("Failed to record session:", error);
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
      toast.info("Daily 90-minute limit reached!", {
        description: "Great work today! Upgrade to Pro for unlimited time."
      });
      return;
    }

    setHasStarted(true);
    const duration = usePomodoroStore.getState().stageDurations[activeStage];
    chrome.runtime.sendMessage({ 
      type: 'START', 
      duration 
    });
    
    usePomodoroStore.setState({
      isRunning: true,
      endTimestamp: Date.now() + (duration * 1000),
      lastUpdated: Date.now()
    });
  };

  const handlePause = () => {
    chrome.runtime.sendMessage({ type: 'PAUSE' });
    usePomodoroStore.setState({
      isRunning: false,
      endTimestamp: null,
      lastUpdated: Date.now()
    });
  };

  const handleResume = () => {
    if (dailyLimitStatus.isLimitReached) {
      toast.info("Daily 90-minute limit reached!", {
        description: "Great work today! Upgrade to Pro for unlimited time."
      });
      return;
    }

    usePomodoroStore.setState({
      isRunning: true,
      endTimestamp: Date.now() + remaining * 1000,
      lastUpdated: Date.now()
    });
  };

  const handleReset = () => {
    chrome.runtime.sendMessage({ type: 'RESET' });
    usePomodoroStore.setState({
      isRunning: false,
      endTimestamp: null,
      sessionCount: 0,
      activeStage,
      lastUpdated: Date.now()
    });
    setHasStarted(false);
    setRemaining(stageDurations[PomodoroStage.Focus]);
  };

  const handleSwitch = () => {
    const nextStage = getNextStage(usePomodoroStore.getState());
    chrome.runtime.sendMessage({ type: 'UPDATE_DURATION', duration: stageDurations[nextStage] });
    usePomodoroStore.setState({
      activeStage: nextStage,
      isRunning: false,
      endTimestamp: null,
      lastUpdated: Date.now()
    });
    setRemaining(stageDurations[nextStage]);
  };

  const handleSkipToNextStage = () => {
    const nextStage = getNextStage(usePomodoroStore.getState());
    chrome.runtime.sendMessage({
      type: 'SKIP_TO_NEXT_STAGE',
      payload: { duration: stageDurations[nextStage] }
    });
    usePomodoroStore.setState({
      activeStage: nextStage,
      isRunning: false,
      endTimestamp: null,
      lastUpdated: Date.now()
    });
    setRemaining(stageDurations[nextStage]);
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
      toast.info("Daily 90-minute limit reached!", {
        description: "Great work today! Upgrade to Pro for unlimited time."
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
                title={dailyLimitStatus.isLimitReached ? "Daily limit reached" : "Focus mode"}
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
                title={dailyLimitStatus.isLimitReached ? "Daily limit reached" : "Break mode"}
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
                title={dailyLimitStatus.isLimitReached ? "Daily limit reached" : "Reset timer"}
                role="button"
              >
                <Icons.resetTimer className="size-4 text-white/90" />
                <span className="sr-only">Reset timer</span>
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
                title={dailyLimitStatus.isLimitReached ? "Daily limit reached" : "Start/Stop timer"}
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
                      {isRunning ? 'Stop' : hasStarted ? 'Resume' : 'Start'}
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
                title={dailyLimitStatus.isLimitReached ? "Daily limit reached" : "Skip to next stage"}
                role="button"
              >
                <Icons.forward className="size-4 text-white/90" />
                <span className="sr-only">Skip to next timer</span>
              </button>

              <button
                className="cursor-pointer relative flex shrink-0 size-10 items-center justify-center rounded-full shadow-lg bg-gradient-to-b text-white/80 backdrop-blur-sm"
                onClick={toggleStatsDialog}
                title="Stats"
                role="button"
              >
                <Icons.graph className="size-4 text-white/90" />
                <span className="sr-only">Stats</span>
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
        onSettingsClick={toggleSettingsDialog}
      />

      <TimerSettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={toggleSettingsDialog}
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