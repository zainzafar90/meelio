import { useAppStore } from "../../../../stores/app.store";
import { TabInfo } from "../../../../types/tab-stash.types";

export const groupTabsByWindow = (
  tabs: TabInfo[]
): Record<number, TabInfo[]> => {
  return tabs.reduce(
    (acc, tab) => {
      if (!acc[tab.windowId]) {
        acc[tab.windowId] = [];
      }
      acc[tab.windowId].push(tab);
      return acc;
    },
    {} as Record<number, TabInfo[]>
  );
};

export const groupTabsByWindowAndGroup = (
  tabs: TabInfo[]
): Record<
  number,
  { ungrouped: TabInfo[]; grouped: Record<number, TabInfo[]> }
> => {
  const result: Record<
    number,
    { ungrouped: TabInfo[]; grouped: Record<number, TabInfo[]> }
  > = {};

  tabs.forEach((tab) => {
    if (!result[tab.windowId]) {
      result[tab.windowId] = { ungrouped: [], grouped: {} };
    }

    if (!tab.groupId || tab.groupId === -1) {
      result[tab.windowId].ungrouped.push(tab);
    } else {
      if (!result[tab.windowId].grouped[tab.groupId]) {
        result[tab.windowId].grouped[tab.groupId] = [];
      }
      result[tab.windowId].grouped[tab.groupId].push(tab);
    }
  });

  return result;
};

export const filterValidTabs = (
  tabs: TabInfo[],
  currentTabId?: number
): TabInfo[] => {
  return tabs.filter((tab) => {
    if (currentTabId && tab.id === currentTabId) return false;
    return true;
  });
};

export const restoreTabsToWindow = async (tabs: TabInfo[]): Promise<void> => {
  const window = await chrome.windows.create({
    url: tabs.map((tab) => tab.url),
    focused: true,
  });

  if (window.tabs) {
    const pinnedTabs = tabs.filter((tab) => tab.pinned);
    for (let i = 0; i < window.tabs.length; i++) {
      const originalTab = tabs[i];
      if (originalTab?.pinned) {
        await chrome.tabs.update(window.tabs[i].id!, {
          pinned: true,
        });
      }
    }
  }
};

export const restoreTabsToWindowWithGroups = async (
  tabs: TabInfo[]
): Promise<void> => {
  const window = await chrome.windows.create({
    url: tabs.map((tab) => tab.url),
    focused: true,
  });

  if (!window.tabs) return;

  for (let i = 0; i < window.tabs.length; i++) {
    const originalTab = tabs[i];
    if (originalTab?.pinned) {
      await chrome.tabs.update(window.tabs[i].id!, { pinned: true });
    }
  }

  const groupMap = new Map<string, { indices: number[]; data?: TabInfo["groupData"] }>();

  tabs.forEach((tab, index) => {
    if (tab.groupId && tab.groupId !== -1) {
      const groupKey = `${tab.windowId}-${tab.groupId}`;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, { indices: [], data: tab.groupData });
      }
      groupMap.get(groupKey)!.indices.push(index);
    }
  });


  for (const [groupKey, { indices, data }] of groupMap.entries()) {
    if (!data) continue;

    const tabIds = indices
      .map((index) => window.tabs?.[index]?.id)
      .filter((id): id is number => id !== undefined);

    if (tabIds.length === 0) continue;

    try {
      const newGroupId = await chrome.tabs.group({ tabIds });

      await chrome.tabGroups.update(newGroupId, {
        title: data.title,
        color: data.color,
        collapsed: data.collapsed,
      });
    } catch (error) {
      console.error("Failed to restore group:", error);
    }
  }
};

export const restoreTabsToExistingWindow = async (
  windowId: number,
  tabs: TabInfo[]
): Promise<void> => {
  const createdTabs = [];

  for (const tab of tabs) {
    const newTab = await chrome.tabs.create({
      windowId,
      url: tab.url,
      pinned: tab.pinned,
      active: false,
    });
    createdTabs.push(newTab);
  }


  const groupMap = new Map<string, { indices: number[]; data?: TabInfo["groupData"] }>();

  tabs.forEach((tab, index) => {
    if (tab.groupId && tab.groupId !== -1) {
      const groupKey = `${tab.windowId}-${tab.groupId}`;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, { indices: [], data: tab.groupData });
      }
      groupMap.get(groupKey)!.indices.push(index);
    }
  });

  for (const [groupKey, { indices, data }] of groupMap.entries()) {
    if (!data) continue;

    const tabIds = indices
      .map((index) => createdTabs[index]?.id)
      .filter((id): id is number => id !== undefined);

    if (tabIds.length === 0) continue;

    try {
      const newGroupId = await chrome.tabs.group({ tabIds });

      await chrome.tabGroups.update(newGroupId, {
        title: data.title,
        color: data.color,
        collapsed: data.collapsed,
      });
    } catch (error) {
      console.error("Failed to restore group:", error);
    }
  }
};

export const checkTabPermissions = async (): Promise<boolean> => {
  const platform = useAppStore.getState().platform;

  if (platform === "web" || !chrome?.permissions) {
    return false;
  }

  return await chrome.permissions.contains({
    permissions: ["tabs", "tabGroups"],
  });
};

export const requestTabPermissions = async (): Promise<boolean> => {
  const platform = useAppStore.getState().platform;

  if (platform === "web" || !chrome?.permissions) {
    return false;
  }

  return await chrome.permissions.request({
    permissions: ["tabs", "tabGroups"],
  });
};
