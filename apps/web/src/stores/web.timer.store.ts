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
    if (message.type === "START" || message.type === "UPDATE_DURATION") {
      this.worker?.postMessage({
        type: message.type,
        payload: { duration: message.duration },
      });
      return;
    }

    this.worker?.postMessage({ type: message.type });
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
export const webTimerStore = createTimerStore(webTimerRuntime);
