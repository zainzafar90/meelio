import { useState } from "react";
import { format } from "date-fns";
import { useTabStashStore } from "../../../../stores/tab-stash.store";
import { TabInfo, TabSession } from "src/types/tab-stash.types";
import {
  filterValidTabs,
  requestTabPermissions,
} from "../utils/tab-stash.utils";
import { useShallow } from "zustand/shallow";
import { useTranslation } from "react-i18next";

const STASH_COUNT_KEY = "meelio:tabstash:count";
const STASH_DATE_KEY = "meelio:tabstash:date";
const DAILY_FREE_STASH_LIMIT = 1;

const getTodayString = () => new Date().toISOString().split("T")[0];

export const getDailyStashCount = (): number => {
  if (typeof window === "undefined") return 0;
  const today = getTodayString();
  const lastDate = localStorage.getItem(STASH_DATE_KEY);
  if (lastDate !== today) {
    localStorage.setItem(STASH_DATE_KEY, today);
    localStorage.setItem(STASH_COUNT_KEY, "0");
    return 0;
  }
  return parseInt(localStorage.getItem(STASH_COUNT_KEY) || "0", 10);
};

export const incrementDailyStashCount = () => {
  if (typeof window === "undefined") return;
  const today = getTodayString();
  const lastDate = localStorage.getItem(STASH_DATE_KEY);
  if (lastDate !== today) {
    localStorage.setItem(STASH_DATE_KEY, today);
    localStorage.setItem(STASH_COUNT_KEY, "1");
  } else {
    const count = getDailyStashCount() + 1;
    localStorage.setItem(STASH_COUNT_KEY, count.toString());
  }
};

export const hasReachedDailyStashLimit = (): boolean => {
  return getDailyStashCount() >= DAILY_FREE_STASH_LIMIT;
};

const formatSessionName = (date: Date): string => {
  try {
    return format(date, "MMM d, yyyy h:mm a");
  } catch (error) {
    // Fallback to a simpler date format if date-fns fails
    return new Date().toLocaleString();
  }
};

export const useTabStash = () => {
  const { t } = useTranslation();
  const [isStashing, setIsStashing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addSession, hasPermissions, checkPermissions } = useTabStashStore(
    useShallow((state) => ({
      addSession: state.addSession,
      hasPermissions: state.hasPermissions,
      checkPermissions: state.checkPermissions,
    }))
  );

  const mapChromeTabToTabInfo = (tab: chrome.tabs.Tab): TabInfo => ({
    id: tab.id,
    title: tab.title || "Untitled",
    url: tab.url || "",
    favicon: tab.favIconUrl,
    windowId: tab.windowId,
    pinned: tab.pinned,
  });

  const stashTabs = async (scope: "all" | "current") => {
    setIsStashing(true);
    setError(null);

    try {
      const [currentTab, windows] = await Promise.all([
        chrome.tabs.getCurrent(),
        scope === "all"
          ? chrome.windows.getAll({ populate: true })
          : [await chrome.windows.getCurrent({ populate: true })],
      ]);

      const tabsToStash = windows.flatMap((window) =>
        filterValidTabs(
          (window.tabs || []).map(mapChromeTabToTabInfo),
          currentTab?.id
        )
      );

      if (tabsToStash.length === 0) {
        setError(
          "No stashable tabs found. Extension tabs and empty pages are excluded."
        );
        return;
      }

      const newSession: TabSession = {
        id: crypto.randomUUID(),
        name: formatSessionName(new Date()),
        timestamp: Date.now(),
        tabs: tabsToStash,
        windowCount: windows.length,
      };

      await addSession(newSession);
      incrementDailyStashCount();

      // Close stashed tabs using proper tab IDs
      const tabIds = tabsToStash
        .map((t) => t.id)
        .filter((id): id is number => !!id);

      if (tabIds.length > 0) {
        try {
          await chrome.tabs.remove(tabIds);
        } catch (error) {
          console.warn("Some tabs couldn't be closed:", error);
        }
      }
    } catch (error) {
      console.error("Tab stashing failed:", error);
      setError("Failed to stash tabs. Please try again.");
    } finally {
      setIsStashing(false);
    }
  };

  const ensurePermissions = async (): Promise<boolean> => {
    const hasPerms = await checkPermissions();
    if (!hasPerms) {
      return await requestTabPermissions();
    }
    return true;
  };

  return {
    isStashing,
    error,
    stashTabs,
    ensurePermissions,
    clearError: () => setError(null),
  };
};
