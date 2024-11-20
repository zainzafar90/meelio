import { useEffect } from "react";

import { usePomodoroStore } from "@/stores/pomodoro.store";

const POMODORO_CHANNEL = "pomodoro-sync";

export const usePomodoroSync = () => {
  const {
    updateTimer,
    changeStage,
    setTimerDuration,
    startTimer,
    pauseTimer,
    timer,
  } = usePomodoroStore((state) => ({
    timer: state.timer,
    updateTimer: state.updateTimer,
    changeStage: state.changeStage,
    setTimerDuration: state.setTimerDuration,
    startTimer: state.startTimer,
    pauseTimer: state.pauseTimer,
  }));

  useEffect(() => {
    const channel = new BroadcastChannel(POMODORO_CHANNEL);

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      switch (type) {
        case "TIMER_UPDATE":
          if (payload.running !== timer.running) {
            if (payload.running) {
              startTimer();
            } else {
              pauseTimer();
            }
          }
          updateTimer(payload.remaining);
          break;
        case "STAGE_CHANGE":
          changeStage(payload.stage);
          break;
        case "DURATION_CHANGE":
          setTimerDuration(payload.duration);
          break;
        case "TIMER_STATE":
          if (payload.running !== timer.running) {
            if (payload.running) {
              startTimer();
            } else {
              pauseTimer();
            }
          }
          if (payload.remaining !== timer.remaining) {
            updateTimer(payload.remaining);
          }
          break;
        default:
          break;
      }
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [
    updateTimer,
    changeStage,
    setTimerDuration,
    startTimer,
    pauseTimer,
    timer,
  ]);

  return {
    broadcastTimerUpdate: (remaining: number) => {
      const channel = new BroadcastChannel(POMODORO_CHANNEL);
      channel.postMessage({
        type: "TIMER_UPDATE",
        payload: { remaining, running: timer.running },
      });
      channel.close();
    },
    broadcastStageChange: (stage: number) => {
      const channel = new BroadcastChannel(POMODORO_CHANNEL);
      channel.postMessage({
        type: "STAGE_CHANGE",
        payload: { stage },
      });
      channel.close();
    },
    broadcastDurationChange: (duration: number) => {
      const channel = new BroadcastChannel(POMODORO_CHANNEL);
      channel.postMessage({
        type: "DURATION_CHANGE",
        payload: { duration },
      });
      channel.close();
    },
  };
};
