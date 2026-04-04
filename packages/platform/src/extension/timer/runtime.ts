import type {
  TimerEvent,
  TimerMessage,
  TimerRuntimeAdapter,
} from "@repo/timer-core";

const KNOWN_EVENTS: Set<TimerEvent["type"]> = new Set([
  "TICK",
  "STAGE_COMPLETE",
  "PAUSED",
  "RESET_COMPLETE",
]);

export interface ExtensionTimerRuntimeDeps {
  hasNotificationPermission: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
}

class ExtensionTimerRuntime implements TimerRuntimeAdapter {
  constructor(private readonly deps: ExtensionTimerRuntimeDeps) {}

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

  async requestNotificationPermission(): Promise<boolean> {
    if (!chrome?.permissions?.request) {
      return false;
    }

    if (await this.deps.hasNotificationPermission()) {
      return true;
    }

    return this.deps.requestNotificationPermission();
  }
}

export const createExtensionTimerRuntime = (
  deps: ExtensionTimerRuntimeDeps
): TimerRuntimeAdapter => new ExtensionTimerRuntime(deps);
