import {
  createTimerStore,
  type TimerMessage,
  type TimerEvent,
  type TimerRuntimeAdapter,
} from "@repo/shared";
import TimerWorker from "../workers/timer-worker?worker";

class WebTimerRuntime implements TimerRuntimeAdapter {
  private worker: Worker | null = null;
  private listeners: Set<(message: TimerEvent) => void> = new Set();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    this.worker = new TimerWorker();
    this.worker.onmessage = (event: MessageEvent<TimerEvent>) => {
      this.listeners.forEach(listener => listener(event.data));
    };
  }

  sendMessage(message: TimerMessage): void {
    const workerMessage = {
      type: message.type,
      payload: {
        duration: message.duration,
        ...message,
      },
    };
    this.worker?.postMessage(workerMessage);
  }

  subscribe(callback: (message: TimerEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  showNotification(title: string, message: string): void {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body: message });
    }
  }
}

export const webTimerRuntime = new WebTimerRuntime();
export const useWebTimerStore = createTimerStore(webTimerRuntime);
export const webTimerStore = useWebTimerStore;
