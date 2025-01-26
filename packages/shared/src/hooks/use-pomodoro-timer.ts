import { useEffect, useRef } from "react";
import { AuthUser } from "../types/auth";
import { PomodoroStage } from "../types/pomodoro";
import { usePomodoroStore } from "../stores/pomodoro.store";
import { changeFavicon } from "../utils/favicon.utils";
import { playPomodoroSound } from "../utils/sound.utils";

export const usePomodoroTimer = ({ user }: { user: AuthUser | null }) => {
  const { timer, updateTimer, advanceTimer } = usePomodoroStore((state) => ({
    timer: state.timer,
    updateTimer: state.updateTimer,
    advanceTimer: state.advanceTimer,
  }));

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  const resetAppTitle = () => {
    document.title = "Meelio - focus, calm, & productivity";
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Main timer effect
  useEffect(() => {
    if (!timer.running) {
      stopTimer();
      return;
    }

    // Initialize start time if needed
    if (!startTimeRef.current) {
      startTimeRef.current =
        Date.now() -
        (timer.stageSeconds[timer.activeStage] - timer.remaining) * 1000;
    }

    const tick = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      const remaining = Math.max(
        0,
        timer.stageSeconds[timer.activeStage] - elapsed
      );

      // Only update if the remaining time has changed
      if (remaining !== lastTickRef.current) {
        lastTickRef.current = remaining;
        updateTimer(remaining);

        if (remaining <= 0) {
          stopTimer();
          if (timer.enableSound) {
            playPomodoroSound("timeout");
          }
          advanceTimer();
          return;
        }
      }

      timerRef.current = setTimeout(tick, 100); // Poll more frequently for accuracy
    };

    timerRef.current = setTimeout(tick, 100);

    return () => stopTimer();
  }, [timer.running, timer.activeStage]);

  // Reset start time when stage changes
  useEffect(() => {
    startTimeRef.current =
      Date.now() -
      (timer.stageSeconds[timer.activeStage] - timer.remaining) * 1000;
  }, [timer.activeStage, timer.stageSeconds]);

  // Favicon effect
  useEffect(() => {
    const isBreak =
      timer.activeStage === PomodoroStage.ShortBreak ||
      timer.activeStage === PomodoroStage.LongBreak;
    const faviconPath = isBreak ? "/favicon-break.ico" : "/favicon.ico";
    changeFavicon(faviconPath);
  }, [timer.activeStage]);

  // Title update effect
  useEffect(() => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    if (!timer.running) {
      resetAppTitle();
      return;
    }

    const isFocus = timer.activeStage === PomodoroStage.WorkTime;
    document.title = `${formatTime(timer.remaining)} ${
      isFocus ? "\u00A0💡\u00B7\u00A0Focus" : "\u00A0✨\u00B7\u00A0Break"
    }`;
  }, [timer.remaining, timer.activeStage, timer.running]);

  // Cleanup on user change
  useEffect(() => {
    if (!user) {
      stopTimer();
      resetAppTitle();
    }
  }, [user]);
};
