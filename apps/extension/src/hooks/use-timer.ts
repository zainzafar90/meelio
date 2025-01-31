import { useEffect, useState } from "react";
export interface TimerState {
  isRunning: boolean;
  timeLeft: number;
  mode: "focus" | "break";
  totalTime: number;
}
export function useTimer(timerService: any) {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    timeLeft: 25 * 60,
    mode: "focus",
    totalTime: 25 * 60,
  });
  useEffect(() => {
    const unsubscribe = timerService.subscribe(setTimerState);
    return () => unsubscribe();
  }, [timerService]);
  return {
    ...timerState,
    start: () => timerService.start(),
    pause: () => timerService.pause(),
    reset: () => timerService.reset(),
    setMode: (mode: "focus" | "break") => timerService.setMode(mode),
  };
}
