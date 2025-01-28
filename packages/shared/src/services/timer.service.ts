export interface TimerWorker {
  start(duration: number): void;
  pause(): void;
  reset(): void;
  onTick(callback: (remaining: number) => void): void;
  onComplete(callback: () => void): void;
}

class WebWorkerTimer implements TimerWorker {
  private worker: Worker;
  private tickCallback?: (remaining: number) => void;
  private completeCallback?: () => void;

  constructor(worker: Worker) {
    this.worker = worker;
    this.worker.onmessage = (e) => {
      if (e.data.type === "tick" && this.tickCallback) {
        console.log("web:tick", e.data);
        this.tickCallback(e.data.remaining);
      } else if (e.data.type === "complete" && this.completeCallback) {
        console.log("web:complete", e.data);
        this.completeCallback();
      }
    };
  }

  start(duration: number): void {
    this.worker.postMessage({ command: "start", duration });
    console.log("web:start");
  }

  pause(): void {
    this.worker.postMessage({ command: "pause" });
  }

  reset(): void {
    this.worker.postMessage({ command: "start", duration: 0 });
  }

  onTick(callback: (remaining: number) => void): void {
    console.log("web:onTick");
    this.tickCallback = callback;
  }

  onComplete(callback: () => void): void {
    console.log("web:onComplete");
    this.completeCallback = callback;
  }
}

class ExtensionTimer implements TimerWorker {
  private tickCallback?: (remaining: number) => void;
  private completeCallback?: () => void;

  constructor() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "tick" && this.tickCallback) {
        console.log("extension:tick", message);
        this.tickCallback(message.remaining);
      } else if (message.type === "complete" && this.completeCallback) {
        console.log("extension:complete", message);
        this.completeCallback();
      }
    });
  }

  start(duration: number): void {
    chrome.runtime.sendMessage({ type: "start", duration });
    console.log("extension:start");
  }

  pause(): void {
    chrome.runtime.sendMessage({ type: "pause" });
  }

  reset(): void {
    chrome.runtime.sendMessage({ type: "reset", duration: 0 });
  }

  onTick(callback: (remaining: number) => void): void {
    console.log("extension:onTick");
    this.tickCallback = callback;
  }

  onComplete(callback: () => void): void {
    console.log("extension:onComplete");
    this.completeCallback = callback;
  }
}

export class TimerService {
  private worker: TimerWorker;

  constructor(type: "web" | "extension", worker?: Worker) {
    if (type === "web" && !worker) {
      throw new Error("Worker is required");
    }

    this.worker =
      type === "web"
        ? new WebWorkerTimer(worker as Worker)
        : new ExtensionTimer();
  }

  start(duration: number): void {
    this.worker.start(duration);
  }

  pause(): void {
    this.worker.pause();
  }

  reset(): void {
    this.worker.reset();
  }

  // Type guard to check if worker is WebWorkerTimer
  private isWebWorker(worker: TimerWorker): worker is WebWorkerTimer {
    return worker instanceof WebWorkerTimer;
  }

  // Type guard to check if worker is ExtensionTimer
  private isExtensionTimer(worker: TimerWorker): worker is ExtensionTimer {
    return worker instanceof ExtensionTimer;
  }

  onTick(callback: (remaining: number) => void): void {
    if (this.isWebWorker(this.worker)) {
      this.worker.onTick((remaining) => {
        callback(remaining);
      });
    }

    if (this.isExtensionTimer(this.worker)) {
      this.worker.onTick((remaining) => {
        callback(remaining);
      });
    }
  }

  onComplete(callback: () => void): void {
    if (this.isWebWorker(this.worker)) {
      this.worker.onComplete(callback);
    }

    if (this.isExtensionTimer(this.worker)) {
      this.worker.onComplete(callback);
    }
  }
}
