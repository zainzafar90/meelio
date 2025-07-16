import { resetDatabase } from "../lib/db/meelio.dexie";
import { useAuthStore } from "../stores/auth.store";
import { useBackgroundStore } from "../stores/background.store";
import { useDockStore } from "../stores/dock.store";
import { useOnboardingStore } from "../stores/onboarding.store";
import { useAppStore } from "../stores/app.store";
import { useSettingsStore } from "../stores/settings.store";
import { useMantraStore, useGreetingStore } from "../stores/greetings.store";
import { useTimerStore } from "../stores/timer.store";
import { useCalendarStore } from "../stores";

/**
 * Clear all persisted state and IndexedDB data.
 */
export async function clearLocalData() {
  try {
    useAuthStore.persist?.clearStorage?.();
    useBackgroundStore.persist?.clearStorage?.();
    useDockStore.persist?.clearStorage?.();
    useOnboardingStore.persist?.clearStorage?.();
    useAppStore.persist?.clearStorage?.();
    useSettingsStore.persist?.clearStorage?.();
    useMantraStore.persist?.clearStorage?.();
    useGreetingStore.persist?.clearStorage?.();
    useTimerStore().persist?.clearStorage?.();
    useCalendarStore.persist?.clearStorage?.();

    // Remove local-only keys
    localStorage.removeItem("meelio:local:last_daily_reset");
    localStorage.removeItem("meelio:local:name");
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("meelio:local")) {
        localStorage.removeItem(key);
      }
    });

    // Clear chrome extension storage if available
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      try {
        await chrome.storage.local.clear();
      } catch (err) {
        console.error("Failed to clear chrome storage", err);
      }
    }
  } catch (err) {
    console.error("Failed to clear local storage:", err);
  }

  try {
    await resetDatabase();
  } catch (err) {
    console.error("Failed to reset database:", err);
  }
}
