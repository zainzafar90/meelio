interface ChromeTab {
  id: number;
  title: string;
  url: string;
  favicon?: string;
  windowId: number;
  pinned: boolean;
}

export const filterValidTabs = (
  tabs: chrome.tabs.Tab[],
  currentTabId?: number
): ChromeTab[] => {
  return tabs
    .filter(
      (tab): tab is chrome.tabs.Tab =>
        !!tab &&
        !!tab.id &&
        !!tab.windowId &&
        !!tab.url &&
        tab.id !== currentTabId &&
        !tab.url.startsWith("chrome://") &&
        !tab.url.startsWith("chrome-extension://") &&
        !tab.url.startsWith("about:") &&
        !tab.url.startsWith("edge://") &&
        !tab.url.startsWith("moz-extension://") &&
        !tab.url.startsWith("brave://")
    )
    .map((tab) => ({
      id: tab.id!,
      title: tab.title || "Untitled",
      url: tab.url!,
      favicon: tab.favIconUrl,
      windowId: tab.windowId,
      pinned: tab.pinned || false,
    }));
};
