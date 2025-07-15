import { createUnifiedTimerStore } from "@repo/shared";
import TimerWorker from "../workers/timer-worker?worker";

// Web-specific timer platform
class WebTimerPlatform {
  private worker: Worker | null = null;
  private listeners: Set<(message: any) => void> = new Set();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    this.worker = new TimerWorker();
    this.worker.onmessage = (event) => {
      this.listeners.forEach(listener => listener(event.data));
    };
  }

  sendMessage(message: any): void {
    // Transform message format for web worker
    const workerMessage = {
      type: message.type,
      payload: {
        duration: message.duration,
        ...message
      }
    };
    this.worker?.postMessage(workerMessage);
  }

  onMessage(callback: (message: any) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  showNotification(title: string, message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }
}

// Create web-specific store with platform access
const webPlatform = new WebTimerPlatform();
export const useWebUnifiedTimerStore = createUnifiedTimerStore(webPlatform);

// Export platform for message listening
export const webTimerPlatform = webPlatform;