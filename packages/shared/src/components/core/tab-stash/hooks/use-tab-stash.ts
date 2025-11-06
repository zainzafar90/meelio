import { useState } from "react";
import { format } from "date-fns";
import { useTabStashStore } from "../../../../stores/tab-stash.store";
import {
  TabInfo,
  TabSession,
  TabGroup,
  TabGroupColor,
} from "src/types/tab-stash.types";
import {
  filterValidTabs,
  requestTabPermissions,
} from "../utils/tab-stash.utils";
import { useShallow } from "zustand/shallow";
import { useTranslation } from "react-i18next";
import { generateUUID } from "../../../../utils/common.utils";

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
    groupId: tab.groupId,
  });

  const stashTabs = async (scope: "all" | "current") => {
    setIsStashing(true);
    setError(null);

    try {
      const currentTab = await chrome.tabs.getCurrent();
      const extensionTabId = currentTab?.id;

      const allWindows = scope === "all"
        ? await chrome.windows.getAll({ populate: true })
        : [await chrome.windows.getCurrent({ populate: true })];

      if (scope === "all" && allWindows.length <= 1) {
        setError(
          t("tab-stash.no-other-windows", "No other windows to stash. Open additional windows first.")
        );
        return;
      }

      const groupDataMap: Record<string, TabGroup> = {};

      for (const window of allWindows) {
        const windowTabs = window.tabs || [];
        const windowGroupIds = new Set<number>();

        windowTabs.forEach((tab) => {
          if (tab.groupId && tab.groupId !== -1) {
            windowGroupIds.add(tab.groupId);
          }
        });

        for (const groupId of Array.from(windowGroupIds)) {
          try {
            const group = await chrome.tabGroups.get(groupId);
            const groupKey = `${window.id}-${groupId}`;
            groupDataMap[groupKey] = {
              id: group.id,
              title: group.title,
              color: group.color as TabGroupColor,
              collapsed: group.collapsed,
            };
          } catch (error) {
            console.warn(`Failed to get group ${groupId}:`, error);
          }
        }
      }

      const tabsToStash = allWindows.flatMap((window) =>
        filterValidTabs(
          (window.tabs || []).map(mapChromeTabToTabInfo),
          extensionTabId
        )
      );

      if (tabsToStash.length === 0) {
        setError(
          t("tab-stash.no-tabs", "No tabs to stash.")
        );
        return;
      }

      const seenGroups = new Set<string>();
      const processedTabs = tabsToStash.map((tab) => {
        if (tab.groupId && tab.groupId !== -1) {
          const groupKey = `${tab.windowId}-${tab.groupId}`;
          const groupData = groupDataMap[groupKey];

          if (groupData) {
            const isFirstInGroup = !seenGroups.has(groupKey);
            seenGroups.add(groupKey);

            if (isFirstInGroup) {
              return {
                ...tab,
                groupData,
              };
            }
          }
        }
        return tab;
      });

      const newSession: TabSession = {
        id: generateUUID(),
        name: formatSessionName(new Date()),
        timestamp: Date.now(),
        tabs: processedTabs,
        windowCount: allWindows.length,
        groups: Object.keys(groupDataMap).length > 0 ? groupDataMap : undefined,
      };

      await addSession(newSession);

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
      setError(
        t("tab-stash.stash-failed", "Failed to stash tabs. Please try again.")
      );
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
