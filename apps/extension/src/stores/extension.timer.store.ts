import { createTimerStore } from "@repo/shared/src/stores/timer.store";
import type {
  TimerRuntimeAdapter,
  TimerMessage,
  TimerEvent,
} from "@repo/shared/src/types/timer.types";

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

    const listener = (message: TimerEvent) => {
      if (message?.type) {
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
export const useExtensionTimerStore = createTimerStore(extensionTimerRuntime);
export const extensionTimerStore = useExtensionTimerStore;
