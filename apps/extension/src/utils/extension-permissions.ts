import {
  BLOCKER_REQUIRED_ORIGINS,
  hasBlockerAccessPermission as hasPlatformBlockerAccessPermission,
  requestBlockerAccessPermission as requestPlatformBlockerAccessPermission,
} from "../../../../packages/platform/src/extension/site-blocker";

export { BLOCKER_REQUIRED_ORIGINS };

export const BLOCKER_OPTIONAL_PERMISSION_REQUEST = {
  origins: [...BLOCKER_REQUIRED_ORIGINS] as string[],
};

const NOTIFICATION_PERMISSION = "notifications";
export const NOTIFICATION_PERMISSION_REQUEST = {
  permissions: [NOTIFICATION_PERMISSION] as string[],
};

export const hasBlockerAccessPermission = async (): Promise<boolean> =>
  hasPlatformBlockerAccessPermission();

export const requestBlockerAccessPermission = async (): Promise<boolean> =>
  requestPlatformBlockerAccessPermission();

export const hasNotificationPermission = async (): Promise<boolean> =>
  chrome.permissions.contains(NOTIFICATION_PERMISSION_REQUEST);

export const requestNotificationPermission = async (): Promise<boolean> =>
  chrome.permissions.request(NOTIFICATION_PERMISSION_REQUEST);
