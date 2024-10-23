import { useEffect } from "react";

import Worker from "@/workers/timer.worker?worker";

import { AuthUser } from "@/types/auth";
import { PomodoroStage } from "@/types/pomodoro";
import { usePomodoroStore } from "@/store/pomodoro.store";
import { changeFavicon } from "@/utils/favicon.utils";
import { playPomodoroSound } from "@/utils/sound.utils";

const worker = new Worker();

export const usePomodoroTimer = ({ user }: { user: AuthUser | null }) => {
  const { timer, updateTimer, advanceTimer } = usePomodoroStore();

  const resetAppTitle = () => {
    document.title = "Meelio - focus, calm, & productivity";
  };

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
    if (!worker) return;

    if (timer.running) {
      worker.postMessage({ command: "start", duration: timer.remaining });
    } else {
      worker.postMessage({ command: "pause" });
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

    document.title = `${formatTime(timer.remaining)} ${isFocus ? "\u00A0💡\u00B7\u00A0Focus" : "\u00A0✨\u00B7\u00A0Break"}`;
  }, [timer.remaining]);

  useEffect(() => {
    if (!timer.running) {
      resetAppTitle();
    }
  }, [timer.running]);

  useEffect(() => {
    if (!user) {
      worker.postMessage({ command: "pause" });
      resetAppTitle();
    }
  }, [user]);
};
