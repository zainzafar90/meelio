import { TimerState } from "@repo/shared";



export class ExtensionTimerService {
  private listeners: ((state: TimerState) => void)[] = [];
  private state: TimerState = {
    isRunning: false,
    timeLeft: 25 * 60,
    mode: 'focus',
  };

  constructor() {
    // Listen for timer updates from the background script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'TIMER_UPDATE') {
        this.state = message.state;
        this.notifyListeners();
      }
    });

    // Get initial state
    chrome.runtime.sendMessage({ type: 'GET_TIMER_STATE' }, (state) => {
      if (state) {
        this.state = state;
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
    chrome.runtime.sendMessage({ type: 'START_TIMER' }, (state) => {
      if (state) {
        this.state = state;
        this.notifyListeners();
      }
    });
  }

  pause() {
    chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' }, (state) => {
      if (state) {
        this.state = state;
        this.notifyListeners();
      }
    });
  }

  reset() {
    chrome.runtime.sendMessage({ type: 'RESET_TIMER' }, (state) => {
      if (state) {
        this.state = state;
        this.notifyListeners();
      }
    });
  }

  setMode(mode: 'focus' | 'break') {
    chrome.runtime.sendMessage({ type: 'SET_MODE', mode }, (state) => {
      if (state) {
        this.state = state;
        this.notifyListeners();
      }
    });
  }
}

export const extensionTimerService = new ExtensionTimerService(); 