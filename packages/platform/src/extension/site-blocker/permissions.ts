export const BLOCKER_REQUIRED_ORIGINS = ["http://*/*", "https://*/*"] as const;

export const hasBlockerAccessPermission = async (): Promise<boolean> =>
  chrome.permissions.contains({
    origins: [...BLOCKER_REQUIRED_ORIGINS],
  });

export const requestBlockerAccessPermission = async (): Promise<boolean> =>
  chrome.permissions.request({
    origins: [...BLOCKER_REQUIRED_ORIGINS],
  });
