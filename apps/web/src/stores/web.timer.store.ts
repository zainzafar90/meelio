import { createTimerStore } from "@repo/shared";
import TimerWorker from "../workers/timer-worker?worker";

interface TimerMessage {
  type: string;
  duration?: number;
  remaining?: number;
}

class WebTimerPlatform {
  private worker: Worker | null = null;
  private listeners: Set<(message: TimerMessage) => void> = new Set();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    this.worker = new TimerWorker();
    this.worker.onmessage = (event) => {
      this.listeners.forEach(listener => listener(event.data));
    };
  }

  sendMessage(message: TimerMessage): void {
    const workerMessage = {
      type: message.type,
      payload: {
        duration: message.duration,
        ...message
      }
    };
    this.worker?.postMessage(workerMessage);
  }

  onMessage(callback: (message: TimerMessage) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  showNotification(title: string, message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }
}

const webPlatform = new WebTimerPlatform();
export const useWebTimerStore = createTimerStore(webPlatform);

export const webTimerPlatform = webPlatform;