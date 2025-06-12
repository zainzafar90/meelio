import { TimerMessage, createTimerStore } from "@repo/shared";
import TimerWorker from "../workers/timer-worker?worker";

/**
 * Web worker manager for timer functionality
 */
class WebTimerWorker {
  private worker: Worker | null = null;
  private messageHandlers: Set<(event: MessageEvent) => void> = new Set();
  private isInitialized = false;

  private initWorker() {
    if (this.isInitialized) return;
    
    try {
      this.worker = new TimerWorker();
      this.isInitialized = true;
      
      this.worker.onmessage = (event) => {
        // Forward messages to all registered handlers
        this.messageHandlers.forEach(handler => handler(event));
      };
    } catch (error) {
      console.error("Failed to initialize timer worker:", error);
    }
  }

  postMessage(msg: TimerMessage) {
    this.initWorker();
    if (!this.worker) {
      console.warn("Timer worker not initialized");
      return;
    }

    // Translate from TimerMessage format to web worker format
    switch (msg.type) {
      case "START":
        this.worker.postMessage({
          type: "START",
          payload: { duration: msg.duration }
        });
        break;
      case "PAUSE":
        this.worker.postMessage({ type: "PAUSE" });
        break;
      case "RESET":
        this.worker.postMessage({ type: "RESET" });
        break;
      case "UPDATE_DURATION":
        this.worker.postMessage({
          type: "UPDATE_DURATION",
          payload: { duration: msg.duration }
        });
        break;
      case "SKIP_TO_NEXT_STAGE":
        this.worker.postMessage({ type: "SKIP_TO_NEXT_STAGE" });
        break;
    }
  }

  addMessageHandler(handler: (event: MessageEvent) => void) {
    this.initWorker();
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: (event: MessageEvent) => void) {
    this.messageHandlers.delete(handler);
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.messageHandlers.clear();
  }
}

// Global instance for web timer worker
const webTimerWorker = new WebTimerWorker();

/**
 * Web-specific timer store that uses web worker for background processing
 */
export const useWebTimerStore = createTimerStore({
  now: () => Date.now(),
  pushUsage: async () => Promise.resolve(),
  pushSettings: async () => Promise.resolve(),
  postMessage: (msg: TimerMessage) => {
    webTimerWorker.postMessage(msg);
  },
}) as ReturnType<typeof createTimerStore>;

/**
 * Get the web timer worker instance for direct message handling
 */
export const getWebTimerWorker = () => webTimerWorker;

// Cleanup function for when the app unmounts
export const cleanupWebTimerWorker = () => {
  webTimerWorker.terminate();
};