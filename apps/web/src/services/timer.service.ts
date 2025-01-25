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
    // Use heartbeat worker for web app, timer worker for extension
    const isExtension = window.location.protocol === 'chrome-extension:';
    const workerPath = isExtension ? '../workers/timer.worker.ts' : '../workers/heartbeat.worker.ts';
    
    this.worker = new Worker(
      new URL(workerPath, import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (event) => {
      if (isExtension) {
        this.state = event.data;
      } else {
        // Handle heartbeat worker messages
        if (event.data.type === 'heartbeat') {
          const elapsed = event.data.elapsed / 1000; // Convert ms to seconds
          this.state = {
            ...this.state,
            isRunning: true,
            timeLeft: Math.max(0, this.state.totalTime - Math.floor(elapsed)),
          };
          
          // Handle mode switch when timer completes
          if (this.state.timeLeft <= 0) {
            this.state.mode = this.state.mode === 'focus' ? 'break' : 'focus';
            this.state.totalTime = this.state.mode === 'focus' ? 25 * 60 : 5 * 60;
            this.state.timeLeft = this.state.totalTime;
            this.worker.postMessage({ type: 'reset' });
          }
        }
      }
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
    const isExtension = window.location.protocol === 'chrome-extension:';
    this.worker.postMessage({ type: isExtension ? 'START' : 'start' });
    if (!isExtension) {
      this.state.isRunning = true;
      this.notifyListeners();
    }
  }

  pause() {
    const isExtension = window.location.protocol === 'chrome-extension:';
    this.worker.postMessage({ type: isExtension ? 'PAUSE' : 'stop' });
    if (!isExtension) {
      this.state.isRunning = false;
      this.notifyListeners();
    }
  }

  reset() {
    const isExtension = window.location.protocol === 'chrome-extension:';
    this.worker.postMessage({ type: isExtension ? 'RESET' : 'reset' });
    if (!isExtension) {
      this.state.timeLeft = this.state.totalTime;
      this.state.isRunning = false;
      this.notifyListeners();
    }
  }

  setMode(mode: 'focus' | 'break') {
    const isExtension = window.location.protocol === 'chrome-extension:';
    if (isExtension) {
      this.worker.postMessage({ type: 'SET_MODE', mode });
    } else {
      this.state.mode = mode;
      this.state.totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
      this.state.timeLeft = this.state.totalTime;
      this.worker.postMessage({ type: 'reset' });
      this.notifyListeners();
    }
  }
}

export const webTimerService = new WebTimerService(); 