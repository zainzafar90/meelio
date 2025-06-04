export interface PomodoroTimerClient {
  send: (message: any) => void;
  addListener: (handler: (message: any) => void) => () => void;
}

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { usePomodoroStore } from "../stores";
import { PomodoroStage } from "../types";
import { formatTime } from "../utils/timer.utils";

export function usePomodoroTimer(client: PomodoroTimerClient) {
  const { t } = useTranslation();
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
    client.send({ type: "UPDATE_DURATION", duration });

    if (newState.isRunning) {
      client.send({ type: "START", duration });
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
        description: t("timer.limitReached.description"),
      });
    }
  };

  const handleStart = async () => {
    if (dailyLimitStatus.isLimitReached) {
      toast.info(t("timer.limitReached.toast"), {
        description: t("timer.limitReached.description"),
      });
      return;
    }

    const store = usePomodoroStore.getState();
    if (store.enableSound && Notification.permission === "default") {
      await store.requestNotificationPermission();
    }

    setHasStarted(true);
    const duration = store.stageDurations[activeStage];
    client.send({ type: "START", duration });

    store.startTimer();
    usePomodoroStore.setState({
      endTimestamp: Date.now() + duration * 1000,
      lastUpdated: Date.now(),
    });
  };

  const handlePause = () => {
    client.send({ type: "PAUSE" });
    const store = usePomodoroStore.getState();
    store.pauseTimer();
    usePomodoroStore.setState({ endTimestamp: null, lastUpdated: Date.now() });
  };

  const handleResume = () => {
    if (dailyLimitStatus.isLimitReached) {
      toast.info(t("timer.limitReached.toast"), {
        description: t("timer.limitReached.description"),
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
    client.send({ type: "RESET" });
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
    const nextStage = activeStage === PomodoroStage.Focus ? PomodoroStage.Break : PomodoroStage.Focus;
    client.send({ type: "RESET" });
    client.send({ type: "UPDATE_DURATION", duration: stageDurations[nextStage] });
    store.changeStage(nextStage);
    usePomodoroStore.setState({ endTimestamp: null, lastUpdated: Date.now() });
    setHasStarted(false);
    setRemaining(stageDurations[nextStage]);
  };

  const handleSkipToNextStage = () => {
    const store = usePomodoroStore.getState();
    client.send({ type: "SKIP_TO_NEXT_STAGE" });
    store.advanceTimer();
    const state = usePomodoroStore.getState();
    const duration = state.stageDurations[state.activeStage];
    client.send({ type: "UPDATE_DURATION", duration });
    usePomodoroStore.setState({
      endTimestamp: state.isRunning ? Date.now() + duration * 1000 : null,
      lastUpdated: Date.now(),
    });
    setRemaining(duration);
  };

  useEffect(() => {
    const unsubscribe = client.addListener((msg: any) => {
      switch (msg.type) {
        case "TICK":
          setIsLoading(false);
          setRemaining(msg.remaining);
          usePomodoroStore.getState().updateTimer(msg.remaining);
          break;
        case "STAGE_COMPLETE":
          completeStage();
          break;
        case "PAUSED":
          setRemaining(msg.remaining);
          usePomodoroStore.setState({
            isRunning: false,
            endTimestamp: null,
            lastUpdated: Date.now(),
          });
          break;
        case "RESET_COMPLETE":
          usePomodoroStore.setState({
            isRunning: false,
            endTimestamp: null,
            sessionCount: 0,
            activeStage,
            lastUpdated: Date.now(),
          });
          setHasStarted(false);
          setRemaining(stageDurations[activeStage]);
          break;
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isRunning && endTimestamp) {
      const remainingTime = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
      if (remainingTime > 0) {
        client.send({ type: "START", duration: remainingTime });
      } else {
        client.send({ type: "STAGE_COMPLETE" });
      }
    }
  }, [isRunning, endTimestamp, activeStage, stageDurations, autoStartTimers]);

  useEffect(() => {
    if (isLoading) return;

    const emoji = activeStage === PomodoroStage.Focus ? "🎯" : "☕";
    const timeStr = formatTime(remaining);
    const mode = activeStage === PomodoroStage.Focus ? "Focus" : "Break";

    document.title = isRunning ? `${emoji} ${timeStr} - ${mode}` : "Meelio - focus, calm, & productivity";
  }, [remaining, activeStage, isRunning, stageDurations, isLoading]);

  useEffect(() => {
    if (isRunning && dailyLimitStatus.isLimitReached) {
      handlePause();
      toast.info(t("timer.limitReached.toast"), {
        description: t("timer.limitReached.description"),
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
    if (!isRunning) {
      setHasStarted(false);
      setRemaining(stageDurations[activeStage]);
    }
  }, [stageDurations, activeStage, isRunning]);

  useEffect(() => {
    if (
      stats.todaysFocusTime === 0 &&
      stats.todaysFocusSessions === 0 &&
      sessionCount === 0
    ) {
      setHasStarted(false);
      setRemaining(stageDurations[activeStage]);
      client.send({ type: "RESET" });
    }
  }, [stats.todaysFocusTime, stats.todaysFocusSessions, sessionCount, stageDurations, activeStage]);

  return {
    activeStage,
    isRunning,
    remaining,
    hasStarted,
    isLoading,
    stageDurations,
    dailyLimitStatus,
    handleStart,
    handlePause,
    handleResume,
    handleReset,
    handleSwitch,
    handleSkipToNextStage,
  };
}

