import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BLOCKER_OPTIONAL_PERMISSION_REQUEST,
  NOTIFICATION_PERMISSION_REQUEST,
  hasBlockerAccessPermission,
  requestBlockerAccessPermission,
  requestNotificationPermission,
} from "../utils/extension-permissions";

describe("extension permission helpers", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests blocker access with all-sites origins only", async () => {
    const request = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("chrome", {
      permissions: {
        request,
      },
    });

    await requestBlockerAccessPermission();

    expect(request).toHaveBeenCalledWith(BLOCKER_OPTIONAL_PERMISSION_REQUEST);
  });

  it("checks blocker access with the same origin bundle", async () => {
    const contains = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("chrome", {
      permissions: {
        contains,
      },
    });

    await hasBlockerAccessPermission();

    expect(contains).toHaveBeenCalledWith(BLOCKER_OPTIONAL_PERMISSION_REQUEST);
  });

  it("requests notification permission independently", async () => {
    const request = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("chrome", {
      permissions: {
        request,
      },
    });

    await requestNotificationPermission();

    expect(request).toHaveBeenCalledWith(NOTIFICATION_PERMISSION_REQUEST);
  });
});
