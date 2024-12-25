import { TimerState } from "@repo/shared";

export class ExtensionTimerService {
  private listeners: ((state: TimerState) => void)[] = [];
  private state: TimerState = {
    isRunning: false,
    timeLeft: 25 * 60,
    mode: 'focus',
    totalTime: 25 * 60
  };

  constructor() {
    // Get initial state
    chrome.runtime.sendMessage({ type: 'GET_TIMER_STATE' }, (state) => {
      this.state = state;
      this.notifyListeners();
    });

    // Listen for updates from background
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'TIMER_UPDATE') {
        this.state = message.state;
        this.notifyListeners();
      }
    });
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
    chrome.runtime.sendMessage({ type: 'START_TIMER' });
  }

  pause() {
    chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' });
  }

  reset() {
    chrome.runtime.sendMessage({ type: 'RESET_TIMER' });
  }

  setMode(mode: 'focus' | 'break') {
    chrome.runtime.sendMessage({ type: 'SET_MODE', mode });
  }
}

export const extensionTimerService = new ExtensionTimerService(); 