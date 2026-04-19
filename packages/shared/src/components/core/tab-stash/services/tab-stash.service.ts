import { format } from "date-fns";

import { useTabStashStore } from "../../../../stores/tab-stash.store";
import type {
  TabGroup,
  TabGroupColor,
  TabInfo,
  TabSession,
} from "../../../../types/tab-stash.types";
import { generateUUID } from "../../../../utils/common.utils";
import {
  filterValidTabs,
  requestTabPermissions,
} from "../utils/tab-stash.utils";

export type TabStashScope = "all" | "current";
export type TabStashFailureCode =
  | "unavailable"
  | "no-other-windows"
  | "no-tabs"
  | "stash-failed";

export type TabStashResult =
  | {
      ok: true;
      session: TabSession;
      closedTabIds: number[];
    }
  | {
      ok: false;
      code: TabStashFailureCode;
    };

type ChromeApi = {
  tabs?: {
    getCurrent: () => Promise<chrome.tabs.Tab | undefined>;
    remove: (tabIds: number[]) => Promise<void>;
  };
  windows?: {
    getAll: (
      queryOptions?: chrome.windows.GetInfo
    ) => Promise<Array<chrome.windows.Window>>;
    getCurrent: (
      queryOptions?: chrome.windows.GetInfo
    ) => Promise<chrome.windows.Window>;
  };
  tabGroups?: {
    get: (groupId: number) => Promise<chrome.tabGroups.TabGroup>;
  };
};

export interface TabStashServiceDeps {
  chromeApi: ChromeApi;
  addSession: (session: TabSession) => Promise<unknown>;
  checkPermissions: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  createId: () => string;
  now: () => Date;
}

const formatSessionName = (date: Date): string => {
  try {
    return format(date, "MMM d, yyyy h:mm a");
  } catch {
    return date.toLocaleString();
  }
};

const mapChromeTabToTabInfo = (tab: chrome.tabs.Tab): TabInfo => ({
  id: tab.id,
  title: tab.title || "Untitled",
  url: tab.url || "",
  favicon: tab.favIconUrl,
  windowId: tab.windowId,
  pinned: tab.pinned,
  groupId: tab.groupId,
});

export const createTabStashService = (deps: TabStashServiceDeps) => {
  const ensurePermissions = async (): Promise<boolean> => {
    const hasPermissions = await deps.checkPermissions();
    if (hasPermissions) {
      return true;
    }

    return deps.requestPermissions();
  };

  const stashTabs = async (scope: TabStashScope): Promise<TabStashResult> => {
    if (
      !deps.chromeApi.tabs?.getCurrent ||
      !deps.chromeApi.tabs.remove ||
      !deps.chromeApi.windows?.getCurrent ||
      !deps.chromeApi.windows?.getAll ||
      !deps.chromeApi.tabGroups?.get
    ) {
      return {
        ok: false,
        code: "unavailable",
      };
    }

    try {
      const currentTab = await deps.chromeApi.tabs.getCurrent();
      const extensionTabId = currentTab?.id;

      const allWindows =
        scope === "all"
          ? await deps.chromeApi.windows.getAll({ populate: true })
          : [await deps.chromeApi.windows.getCurrent({ populate: true })];

      if (scope === "all" && allWindows.length <= 1) {
        return {
          ok: false,
          code: "no-other-windows",
        };
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
            const group = await deps.chromeApi.tabGroups!.get(groupId);
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
        return {
          ok: false,
          code: "no-tabs",
        };
      }

      const seenGroups = new Set<string>();
      const processedTabs = tabsToStash.map((tab) => {
        if (tab.groupId && tab.groupId !== -1) {
          const groupKey = `${tab.windowId}-${tab.groupId}`;
          const groupData = groupDataMap[groupKey];

          if (groupData && !seenGroups.has(groupKey)) {
            seenGroups.add(groupKey);
            return {
              ...tab,
              groupData,
            };
          }
        }

        return tab;
      });

      const currentDate = deps.now();
      const session: TabSession = {
        id: deps.createId(),
        name: formatSessionName(currentDate),
        timestamp: currentDate.getTime(),
        tabs: processedTabs,
        windowCount: allWindows.length,
        groups: Object.keys(groupDataMap).length > 0 ? groupDataMap : undefined,
      };

      await deps.addSession(session);

      const closedTabIds = tabsToStash
        .map((tab) => tab.id)
        .filter((id): id is number => typeof id === "number");

      if (closedTabIds.length > 0) {
        try {
          await deps.chromeApi.tabs.remove(closedTabIds);
        } catch (error) {
          console.warn("Some tabs couldn't be closed:", error);
        }
      }

      return {
        ok: true,
        session,
        closedTabIds,
      };
    } catch (error) {
      console.error("Tab stashing failed:", error);
      return {
        ok: false,
        code: "stash-failed",
      };
    }
  };

  return {
    ensurePermissions,
    stashTabs,
  };
};

export const createDefaultTabStashService = () =>
  createTabStashService({
    chromeApi:
      typeof chrome === "undefined"
        ? {}
        : {
            tabs: chrome.tabs,
            windows: chrome.windows,
            tabGroups: chrome.tabGroups,
          },
    addSession: useTabStashStore.getState().addSession,
    checkPermissions: useTabStashStore.getState().checkPermissions,
    requestPermissions: requestTabPermissions,
    createId: generateUUID,
    now: () => new Date(),
  });
