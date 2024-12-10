export class TimerWorkerWrapper {
  private worker: Worker | null = null;
  private callbacks: { [key: string]: (data: any) => void } = {};

  constructor() {
    if (this.isExtension()) {
      this.initializeExtensionWorker();
    } else {
      this.initializeWebWorker();
    }
  }

  private isExtension() {
    return typeof chrome !== "undefined" && chrome.runtime;
  }

  private initializeWebWorker() {
    // @ts-ignore - Webpack specific
    this.worker = new Worker(new URL("./timer.worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (e) => {
      const callback = this.callbacks[e.data.type];
      if (callback) {
        callback(e.data);
      }
    };
  }

  private initializeExtensionWorker() {
    // @ts-ignore - Chrome specific
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const callback = this.callbacks[message.type];
      if (callback) {
        callback(message);
      }
    });
  }

  public postMessage(message: any) {
    if (this.isExtension()) {
      // @ts-ignore - Chrome specific
      chrome.runtime.sendMessage(message);
    } else if (this.worker) {
      this.worker.postMessage(message);
    }
  }

  public on(type: string, callback: (data: any) => void) {
    this.callbacks[type] = callback;
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.callbacks = {};
  }
}
