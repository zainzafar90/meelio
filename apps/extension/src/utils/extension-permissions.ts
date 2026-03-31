export const BLOCKER_REQUIRED_ORIGINS = ["http://*/*", "https://*/*"] as const;

export const BLOCKER_OPTIONAL_PERMISSION_REQUEST = {
  origins: [...BLOCKER_REQUIRED_ORIGINS] as string[],
};

export const NOTIFICATION_PERMISSION_REQUEST = {
  permissions: ["notifications"] as string[],
};

export const hasBlockerAccessPermission = async (): Promise<boolean> =>
  chrome.permissions.contains(BLOCKER_OPTIONAL_PERMISSION_REQUEST);

export const requestBlockerAccessPermission = async (): Promise<boolean> =>
  chrome.permissions.request(BLOCKER_OPTIONAL_PERMISSION_REQUEST);

export const hasNotificationPermission = async (): Promise<boolean> =>
  chrome.permissions.contains(NOTIFICATION_PERMISSION_REQUEST);

export const requestNotificationPermission = async (): Promise<boolean> =>
  chrome.permissions.request(NOTIFICATION_PERMISSION_REQUEST);
