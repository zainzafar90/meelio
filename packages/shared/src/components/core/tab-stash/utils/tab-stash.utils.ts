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

export const filterValidTabs = (
  tabs: TabInfo[],
  currentTabId?: number
): TabInfo[] => {
  return tabs.filter((tab) => {
    if (tab.id === currentTabId) return false;
    const url = tab.url.toLowerCase();

    // Exclude extension pages
    if (
      /^(chrome-extension|moz-extension|ms-browser-extension):\/\//i.test(url)
    ) {
      return false;
    }

    // Exclude browser's internal extension management pages
    if (
      /^(chrome|edge|brave):\/\/extensions\//i.test(url) ||
      url.startsWith("about:addons") ||
      url.startsWith("about:debugging")
    ) {
      return false;
    }

    // Exclude new tab pages, about:blank, and browser-specific start pages
    if (
      /^(chrome|edge|brave):\/\/newtab(\/|$)/i.test(url) ||
      /^chrome:\/\/new-tab-page(\/|$)/i.test(url) ||
      /^about:(newtab|blank|home)$/i.test(url) ||
      /^(opera|vivaldi):\/\/startpage(\/|$)/i.test(url)
    ) {
      return false;
    }

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

export const checkTabPermissions = async (): Promise<boolean> => {
  const platform = useAppStore.getState().platform;

  if (platform === "web") {
    return false;
  }

  return await chrome.permissions.contains({
    permissions: ["tabs"],
  });
};

export const requestTabPermissions = async (): Promise<boolean> => {
  const platform = useAppStore.getState().platform;

  if (platform === "web") {
    return false;
  }

  return await chrome.permissions.request({
    permissions: ["tabs"],
  });
};
