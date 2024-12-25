import { TimerState } from "@repo/shared";

export class WebTimerService {
  private worker: Worker;
  private listeners: ((state: TimerState) => void)[] = [];
  private state: TimerState = {
    isRunning: false,
    timeLeft: 25 * 60,
    mode: 'focus',
    totalTime: 25 * 60
  };

  constructor() {
    this.worker = new Worker(
      new URL('../workers/timer.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (event) => {
      this.state = event.data;
      this.notifyListeners();
    };
  }

  subscribe(listener: (state: TimerState) => void) {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  start() {
    this.worker.postMessage({ type: 'START' });
  }

  pause() {
    this.worker.postMessage({ type: 'PAUSE' });
  }

  reset() {
    this.worker.postMessage({ type: 'RESET' });
  }

  setMode(mode: 'focus' | 'break') {
    this.worker.postMessage({ type: 'SET_MODE', mode });
  }
}

export const webTimerService = new WebTimerService(); 