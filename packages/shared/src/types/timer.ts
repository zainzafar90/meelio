export interface TimerState {
  isRunning: boolean;
  timeLeft: number;
  mode: "focus" | "break";
}
