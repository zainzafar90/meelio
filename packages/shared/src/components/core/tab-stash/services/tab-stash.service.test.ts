import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTabStashService } from "./tab-stash.service";

const createChromeApi = () => ({
  tabs: {
    getCurrent: vi.fn(),
    remove: vi.fn(),
  },
  windows: {
    getAll: vi.fn(),
    getCurrent: vi.fn(),
  },
  tabGroups: {
    get: vi.fn(),
  },
});

describe("tab stash service", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("creates a recoverable session and closes the stashed tabs", async () => {
    const addSession = vi.fn().mockResolvedValue(undefined);
    const chromeApi = createChromeApi();

    chromeApi.tabs.getCurrent.mockResolvedValue({ id: 10 });
    chromeApi.windows.getCurrent.mockResolvedValue({
      id: 1,
      tabs: [
        { id: 10, title: "Meelio", url: "chrome-extension://newtab" },
        {
          id: 11,
          title: "Inbox",
          url: "https://mail.example.com",
          windowId: 1,
          pinned: false,
          groupId: -1,
        },
        {
          id: 12,
          title: "Docs",
          url: "https://docs.example.com",
          windowId: 1,
          pinned: true,
          groupId: 7,
        },
      ],
    });
    chromeApi.tabGroups.get.mockResolvedValue({
      id: 7,
      title: "Work",
      color: "blue",
      collapsed: false,
    });

    const service = createTabStashService({
      chromeApi,
      addSession,
      checkPermissions: vi.fn().mockResolvedValue(true),
      requestPermissions: vi.fn().mockResolvedValue(true),
      createId: () => "session-1",
      now: () => new Date("2026-04-07T10:00:00.000Z"),
    });

    const result = await service.stashTabs("current");

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        session: expect.objectContaining({
          id: "session-1",
          tabs: expect.arrayContaining([
            expect.objectContaining({
              id: 11,
              url: "https://mail.example.com",
            }),
            expect.objectContaining({
              id: 12,
              groupData: expect.objectContaining({
                title: "Work",
              }),
            }),
          ]),
        }),
      })
    );
    expect(addSession).toHaveBeenCalledTimes(1);
    expect(chromeApi.tabs.remove).toHaveBeenCalledWith([11, 12]);
  });

  it("returns a structured no-other-windows result for all-window stashes", async () => {
    const chromeApi = createChromeApi();

    chromeApi.tabs.getCurrent.mockResolvedValue({ id: 10 });
    chromeApi.windows.getAll.mockResolvedValue([
      {
        id: 1,
        tabs: [{ id: 10, title: "Meelio", url: "chrome-extension://newtab" }],
      },
    ]);

    const service = createTabStashService({
      chromeApi,
      addSession: vi.fn().mockResolvedValue(undefined),
      checkPermissions: vi.fn().mockResolvedValue(true),
      requestPermissions: vi.fn().mockResolvedValue(true),
      createId: () => "session-1",
      now: () => new Date("2026-04-07T10:00:00.000Z"),
    });

    const result = await service.stashTabs("all");

    expect(result).toEqual({
      ok: false,
      code: "no-other-windows",
    });
  });

  it("requests permissions only when the current grant is missing", async () => {
    const requestPermissions = vi.fn().mockResolvedValue(true);
    const service = createTabStashService({
      chromeApi: createChromeApi(),
      addSession: vi.fn().mockResolvedValue(undefined),
      checkPermissions: vi.fn().mockResolvedValue(false),
      requestPermissions,
      createId: () => "session-1",
      now: () => new Date("2026-04-07T10:00:00.000Z"),
    });

    const allowed = await service.ensurePermissions();

    expect(allowed).toBe(true);
    expect(requestPermissions).toHaveBeenCalledTimes(1);
  });
});
