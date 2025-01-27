import { TimerState } from "@repo/shared";

const SECONDS_MULTIPLIER = 60;
const FOCUS_DURATION = 25 * SECONDS_MULTIPLIER; // 25 minutes in seconds
const BREAK_DURATION = 5 * SECONDS_MULTIPLIER;  // 5 minutes in seconds

export interface TimerConfig {
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

export class WebTimerService {
  private worker: Worker;
  private listeners: ((state: TimerState) => void)[] = [];
  private config: TimerConfig = {
    autoStartBreaks: true,
    autoStartFocus: true
  };
  private state: TimerState = {
    isRunning: false,
    timeLeft: FOCUS_DURATION,
    mode: 'focus',
    totalTime: FOCUS_DURATION
  };

  constructor() {
    this.worker = new Worker(
      new URL('../workers/heartbeat.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (event) => {

        if (event.data.type === 'heartbeat') {
          const elapsed = event.data.elapsed / 1000; // Convert ms to seconds
          this.state = {
            ...this.state,
            isRunning: true,
            timeLeft: Math.max(0, this.state.totalTime - Math.floor(elapsed)),
          };
          
          // Handle mode switch when timer completes
          if (this.state.timeLeft <= 0) {
            const nextMode = this.state.mode === 'focus' ? 'break' : 'focus';
            const nextDuration = nextMode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
            const shouldAutoStart = nextMode === 'focus' 
              ? this.config.autoStartFocus 
              : this.config.autoStartBreaks;

            this.state = {
              ...this.state,
              mode: nextMode,
              totalTime: nextDuration,
              timeLeft: nextDuration,
              isRunning: shouldAutoStart
            };
            
            this.worker.postMessage({ type: 'reset' });
            if (shouldAutoStart) {
              this.worker.postMessage({ type: 'start' });
            }
          }
        }
      }
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

  updateConfig(config: Partial<TimerConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): TimerConfig {
    return { ...this.config };
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
      const duration = mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
      this.state.mode = mode;
      this.state.totalTime = duration;
      this.state.timeLeft = duration;
      this.worker.postMessage({ type: 'reset' });
      this.notifyListeners();
    }
  }
}

export const webTimerService = new WebTimerService(); 