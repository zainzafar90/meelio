import { useEffect } from "react";
import { AuthUser } from "../types/auth";
import { PomodoroStage } from "../types/pomodoro";
import { usePomodoroStore } from "../stores/pomodoro.store";
import { changeFavicon } from "../utils/favicon.utils";
import { playPomodoroSound } from "../utils/sound.utils";

export const usePomodoroTimer = ({
  user,
  worker,
}: {
  user: AuthUser | null;
  worker: Worker;
}) => {
  const { timer, updateTimer, advanceTimer } = usePomodoroStore((state) => ({
    timer: state.timer,
    updateTimer: state.updateTimer,
    advanceTimer: state.advanceTimer,
  }));

  const resetAppTitle = () => {
    document.title = "Meelio - focus, calm, & productivity";
    changeFavicon("/favicon.ico");
  };

  useEffect(() => {
    if (!worker) return;

    if (timer.running) {
      worker.postMessage({ command: "start", duration: timer.remaining });
    } else {
      worker.postMessage({ command: "pause" });
    }
  }, [timer.running, timer.remaining]);

  useEffect(() => {
    if (!worker) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "tick") {
        updateTimer(e.data.remaining);
      } else if (e.data.type === "complete") {
        if (timer.enableSound) playPomodoroSound("timeout");
        advanceTimer();
      }
    };

    worker.addEventListener("message", handleMessage);
    return () => worker.removeEventListener("message", handleMessage);
  }, [timer.enableSound, updateTimer, advanceTimer]);

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

    if (timer.running) {
      const isFocus = timer.activeStage === PomodoroStage.WorkTime;

      document.title = `${formatTime(timer.remaining)} ${
        isFocus ? "\u00A0💡\u00B7\u00A0Focus" : "\u00A0✨\u00B7\u00A0Break"
      }`;
    } else {
      resetAppTitle();
    }
  }, [timer.remaining, timer.activeStage]);

  useEffect(() => {
    if (!user) {
      worker.postMessage({ command: "pause" });
      resetAppTitle();
    }
  }, [user]);
};
