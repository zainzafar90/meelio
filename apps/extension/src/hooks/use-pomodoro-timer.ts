import { useEffect, useRef } from "react";
import { Timer } from "@/workers/timer.worker";
import { AuthUser } from "@/types/auth";
import { PomodoroStage } from "@/types/pomodoro";
import { usePomodoroStore } from "@/stores/pomodoro.store";
import { changeFavicon } from "@/utils/favicon.utils";
import { playPomodoroSound } from "@/utils/sound.utils";
import { usePomodoroSync } from "./use-pomodoro-sync";

export const usePomodoroTimer = ({ user }: { user: AuthUser | null }) => {
  const timerRef = useRef<Timer | null>(null);
  const { timer, updateTimer, advanceTimer } = usePomodoroStore((state) => ({
    timer: state.timer,
    updateTimer: state.updateTimer,
    advanceTimer: state.advanceTimer,
  }));

  const { broadcastTimerUpdate } = usePomodoroSync();

  const resetAppTitle = () => {
    document.title = "Meelio - focus, calm, & productivity";
  };

  // Initialize timer instance
  useEffect(() => {
    timerRef.current = new Timer(
      (remaining) => {
        updateTimer(remaining);
        broadcastTimerUpdate(remaining);
      },
      () => {
        if (timer.enableSound) playPomodoroSound("timeout");
        advanceTimer();
      }
    );

    return () => {
      timerRef.current?.clear();
    };
  }, []);

  // Handle timer running state
  useEffect(() => {
    if (!timerRef.current) return;

    if (timer.running) {
      timerRef.current.start(timer.remaining);
    } else {
      timerRef.current.pause();
    }
  }, [timer.running, timer.remaining]);

  useEffect(() => {
    const isBreak =
      timer.activeStage === PomodoroStage.ShortBreak ||
      timer.activeStage === PomodoroStage.LongBreak;
    const faviconPath = isBreak ? "/favicon-break.ico" : "/favicon.ico";
    changeFavicon(faviconPath);
  }, [timer.activeStage]);

  useEffect(() => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const isFocus = timer.activeStage === PomodoroStage.WorkTime;
    document.title = `${formatTime(timer.remaining)} ${
      isFocus ? "\u00A0💡\u00B7\u00A0Focus" : "\u00A0✨\u00B7\u00A0Break"
    }`;
  }, [timer.remaining, timer.activeStage]);

  useEffect(() => {
    if (!timer.running) {
      resetAppTitle();
    }
  }, [timer.running]);

  useEffect(() => {
    if (!user) {
      timerRef.current?.pause();
      resetAppTitle();
    }
  }, [user]);
};
