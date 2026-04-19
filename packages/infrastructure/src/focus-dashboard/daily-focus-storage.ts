import type { DailyFocusPlan } from "@repo/contracts/focus-dashboard";

const DAILY_FOCUS_PLAN_KEY = "meelio:daily-focus-plan";

export interface DailyFocusStorageAdapter {
  loadDailyFocusPlan: () => DailyFocusPlan | null;
  saveDailyFocusPlan: (plan: DailyFocusPlan) => void;
  clearDailyFocusPlan: () => void;
}

export interface DailyFocusKeyValueStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const isDailyFocusTask = (value: unknown): value is DailyFocusPlan["topTasks"][number] =>
  Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { id?: unknown }).id === "string" &&
      typeof (value as { title?: unknown }).title === "string" &&
      typeof (value as { completed?: unknown }).completed === "boolean"
  );

const isDailyFocusPlan = (value: unknown): value is DailyFocusPlan =>
  Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { date?: unknown }).date === "string" &&
      typeof (value as { headline?: unknown }).headline === "string" &&
      typeof (value as { intention?: unknown }).intention === "string" &&
      Array.isArray((value as { topTasks?: unknown[] }).topTasks) &&
      (value as { topTasks: unknown[] }).topTasks.every(isDailyFocusTask) &&
      typeof (value as { sessionTarget?: unknown }).sessionTarget === "number" &&
      typeof (value as { reflection?: unknown }).reflection === "string"
  );

export const createDailyFocusStorage = (
  storage: DailyFocusKeyValueStorage
): DailyFocusStorageAdapter => ({
  loadDailyFocusPlan: () => {
    const raw = storage.getItem(DAILY_FOCUS_PLAN_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return isDailyFocusPlan(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
  saveDailyFocusPlan: (plan) => {
    storage.setItem(DAILY_FOCUS_PLAN_KEY, JSON.stringify(plan));
  },
  clearDailyFocusPlan: () => {
    storage.removeItem(DAILY_FOCUS_PLAN_KEY);
  },
});
