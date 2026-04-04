import type {
  TimerEvent,
  TimerMessage,
  TimerRuntimeAdapter,
} from "@repo/contracts/timer";

export interface WorkerTimerFactory {
  new (): Worker;
}

class WebTimerRuntime implements TimerRuntimeAdapter {
  private worker: Worker | null = null;

  private listeners: Set<(message: TimerEvent) => void> = new Set();

  constructor(private readonly WorkerCtor: WorkerTimerFactory) {
    this.initWorker();
  }

  private initWorker() {
    this.worker = new this.WorkerCtor();
    this.worker.onmessage = (event: MessageEvent<TimerEvent>) => {
      this.listeners.forEach((listener) => listener(event.data));
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

  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    return (await Notification.requestPermission()) === "granted";
  }
}

export const createWebTimerRuntime = (
  WorkerCtor: WorkerTimerFactory
): TimerRuntimeAdapter => new WebTimerRuntime(WorkerCtor);
