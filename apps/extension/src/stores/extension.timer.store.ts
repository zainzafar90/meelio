import { createTimerStore } from "@repo/shared";
import type {
  TimerRuntimeAdapter,
  TimerMessage,
  TimerEvent,
} from "@repo/shared";

class ExtensionTimerRuntime implements TimerRuntimeAdapter {
  sendMessage(message: TimerMessage): void {
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage(message);
    }
  }

  subscribe(callback: (message: TimerEvent) => void): () => void {
    if (!chrome?.runtime?.onMessage) {
      return () => {};
    }

    const KNOWN_EVENTS: Set<TimerEvent["type"]> = new Set([
      "TICK",
      "STAGE_COMPLETE",
      "PAUSED",
      "RESET_COMPLETE",
    ]);

    const listener = (message: TimerEvent) => {
      if (KNOWN_EVENTS.has(message?.type)) {
        callback(message);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }

  showNotification(title: string, message: string): void {
    if (!chrome?.notifications?.create) {
      return;
    }

    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("public/icon.png"),
      title,
      message,
    });
  }
}

export const extensionTimerRuntime = new ExtensionTimerRuntime();
export const extensionTimerStore = createTimerStore(extensionTimerRuntime);
