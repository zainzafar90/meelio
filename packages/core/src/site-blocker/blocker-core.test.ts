import { describe, expect, it } from "vitest";

import {
  BLOCKER_EVENT_RETENTION_DAYS,
  DAILY_AGGREGATE_RETENTION_DAYS,
  RAW_SESSION_RETENTION_DAYS,
  applyCompletedSession,
  buildBlockerExport,
  buildDynamicRules,
  cleanupBlockerData,
  createBlockRule,
  createBypassGrant,
  createEmptyBlockerState,
  getBlockDecision,
  importBlockerSnapshot,
  isBlockingActive,
  type BlockerEvent,
  type BlockerExport,
  type BrowsingSession,
} from "./blocker-core";

describe("blocker-core", () => {
  describe("isBlockingActive", () => {
    it("enforces only during focus when activation mode is focus-only", () => {
      expect(
        isBlockingActive(
          {
            enabled: true,
            activationMode: "focus-only",
            permissionGranted: true,
            updatedAt: 0,
          },
          { timerStage: "focus" }
        )
      ).toBe(true);

      expect(
        isBlockingActive(
          {
            enabled: true,
            activationMode: "focus-only",
            permissionGranted: true,
            updatedAt: 0,
          },
          { timerStage: "break" }
        )
      ).toBe(false);
    });
  });

  describe("getBlockDecision", () => {
    it("blocks a matching site when no active bypass exists", () => {
      const state = createEmptyBlockerState();
      const rule = createBlockRule({
        id: "youtube",
        pattern: "youtube.com",
        source: "preset",
      });

      state.rules = [rule];
      state.settings.permissionGranted = true;

      expect(
        getBlockDecision(state, {
          url: "https://www.youtube.com/watch?v=123",
          timerStage: "focus",
          now: 1_000,
        })
      ).toEqual({
        shouldBlock: true,
        matchedRule: rule,
        bypass: null,
      });
    });

    it("allows a matching site while a non-expired per-site bypass is active", () => {
      const state = createEmptyBlockerState();
      const rule = createBlockRule({
        id: "reddit",
        pattern: "reddit.com",
        source: "custom",
      });

      state.rules = [rule];
      state.settings.permissionGranted = true;
      state.bypassGrants = [
        createBypassGrant({
          pattern: "reddit.com",
          originalUrl: "https://www.reddit.com/r/typescript",
          createdAt: 1_000,
          expiresAt: 10_000,
        }),
      ];

      expect(
        getBlockDecision(state, {
          url: "https://www.reddit.com/r/typescript",
          timerStage: "focus",
          now: 5_000,
        })
      ).toEqual({
        shouldBlock: false,
        matchedRule: rule,
        bypass: state.bypassGrants[0],
      });
    });

    it("expires old bypasses before making the decision", () => {
      const state = createEmptyBlockerState();
      state.rules = [
        createBlockRule({
          id: "x",
          pattern: "x.com",
          source: "custom",
        }),
      ];
      state.settings.permissionGranted = true;
      state.bypassGrants = [
        createBypassGrant({
          pattern: "x.com",
          originalUrl: "https://x.com/home",
          createdAt: 1_000,
          expiresAt: 1_500,
        }),
      ];

      const decision = getBlockDecision(state, {
        url: "https://x.com/home",
        timerStage: "focus",
        now: 5_000,
      });

      expect(decision.shouldBlock).toBe(true);
      expect(decision.bypass).toBeNull();
      expect(state.bypassGrants).toEqual([]);
    });
  });

  describe("buildDynamicRules", () => {
    it("builds main-frame redirect rules only for currently enforced patterns", () => {
      const state = createEmptyBlockerState();
      state.settings.permissionGranted = true;
      state.rules = [
        createBlockRule({
          id: "youtube",
          pattern: "youtube.com",
          source: "preset",
        }),
        createBlockRule({
          id: "news",
          pattern: "news.ycombinator.com",
          source: "custom",
          enabled: false,
        }),
      ];
      state.bypassGrants = [
        createBypassGrant({
          pattern: "youtube.com",
          originalUrl: "https://youtube.com/watch?v=123",
          createdAt: 1_000,
          expiresAt: 100_000,
        }),
      ];

      const rules = buildDynamicRules(state, {
        blockedPageUrl: "chrome-extension://abc123/blocked.html",
        timerStage: "focus",
        now: 5_000,
      });

      expect(rules).toEqual([]);

      state.bypassGrants = [];

      expect(
        buildDynamicRules(state, {
          blockedPageUrl: "chrome-extension://abc123/blocked.html",
          timerStage: "focus",
          now: 5_000,
        })
      ).toEqual([
        expect.objectContaining({
          id: 1,
          priority: 1,
          action: {
            type: "redirect",
            redirect: {
              url: "chrome-extension://abc123/blocked.html?pattern=youtube.com",
            },
          },
          condition: expect.objectContaining({
            requestDomains: ["youtube.com"],
            resourceTypes: ["main_frame"],
          }),
        }),
      ]);
    });
  });

  describe("applyCompletedSession", () => {
    it("aggregates visits, duration, blocked attempts, and bypass sessions per day", () => {
      const session: BrowsingSession = {
        id: "session-1",
        host: "youtube.com",
        url: "https://youtube.com/watch?v=123",
        startedAt: "2026-03-31T10:00:00.000Z",
        endedAt: "2026-03-31T10:05:00.000Z",
        durationMs: 300_000,
        tabId: 7,
        wasBlockedRuleMatch: true,
        occurredDuringBypass: true,
      };

      const nextState = applyCompletedSession(createEmptyBlockerState(), session);

      expect(nextState.sessions).toEqual([session]);
      expect(nextState.dailyAggregates).toEqual([
        {
          date: "2026-03-31",
          host: "youtube.com",
          totalDurationMs: 300_000,
          visits: 1,
          blockedAttempts: 1,
          bypassSessions: 1,
        },
      ]);
    });
  });

  describe("cleanupBlockerData", () => {
    it("retains only data within the configured retention windows", () => {
      const now = Date.parse("2026-04-01T00:00:00.000Z");
      const staleEventDate = new Date(
        now - (BLOCKER_EVENT_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000
      ).toISOString();
      const freshEventDate = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const staleSessionDate = new Date(
        now - (RAW_SESSION_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000
      ).toISOString();
      const freshSessionDate = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const staleAggregateDate = new Date(
        now - (DAILY_AGGREGATE_RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .slice(0, 10);
      const freshAggregateDate = new Date(now - 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const cleaned = cleanupBlockerData(
        {
          ...createEmptyBlockerState(),
          bypassGrants: [
            createBypassGrant({
              pattern: "youtube.com",
              originalUrl: "https://youtube.com",
              createdAt: 0,
              expiresAt: now - 1,
            }),
            createBypassGrant({
              pattern: "reddit.com",
              originalUrl: "https://reddit.com",
              createdAt: 0,
              expiresAt: now + 1_000,
            }),
          ],
          events: [
            {
              id: "stale",
              type: "blocked",
              pattern: "youtube.com",
              occurredAt: staleEventDate,
            },
            {
              id: "fresh",
              type: "blocked",
              pattern: "reddit.com",
              occurredAt: freshEventDate,
            },
          ],
          sessions: [
            {
              id: "stale",
              host: "youtube.com",
              url: "https://youtube.com",
              startedAt: staleSessionDate,
              endedAt: staleSessionDate,
              durationMs: 100,
              tabId: 1,
              wasBlockedRuleMatch: false,
              occurredDuringBypass: false,
            },
            {
              id: "fresh",
              host: "reddit.com",
              url: "https://reddit.com",
              startedAt: freshSessionDate,
              endedAt: freshSessionDate,
              durationMs: 100,
              tabId: 1,
              wasBlockedRuleMatch: false,
              occurredDuringBypass: false,
            },
          ],
          dailyAggregates: [
            {
              date: staleAggregateDate,
              host: "youtube.com",
              totalDurationMs: 100,
              visits: 1,
              blockedAttempts: 0,
              bypassSessions: 0,
            },
            {
              date: freshAggregateDate,
              host: "reddit.com",
              totalDurationMs: 100,
              visits: 1,
              blockedAttempts: 0,
              bypassSessions: 0,
            },
          ],
        },
        now
      );

      expect(cleaned.bypassGrants).toHaveLength(1);
      expect(cleaned.events).toHaveLength(1);
      expect(cleaned.sessions).toHaveLength(1);
      expect(cleaned.dailyAggregates).toHaveLength(1);
    });
  });

  describe("import/export", () => {
    it("round-trips blocker snapshots", () => {
      const state = {
        ...createEmptyBlockerState(),
        settings: {
          enabled: false,
          activationMode: "focus-only" as const,
          permissionGranted: true,
          updatedAt: 123,
        },
        rules: [
          createBlockRule({
            id: "youtube",
            pattern: "youtube.com",
            source: "preset",
          }),
        ],
      };

      const snapshot = buildBlockerExport(state, "2026-04-01T00:00:00.000Z");
      expect(importBlockerSnapshot(snapshot)).toEqual({
        ...createEmptyBlockerState(),
        ...state,
      });
    });

    it("backfills missing snapshot fields", () => {
      const snapshot: BlockerExport = {
        version: 1,
        exportedAt: "2026-04-01T00:00:00.000Z",
        state: {
          settings: {
            enabled: true,
            activationMode: "always",
            permissionGranted: false,
            updatedAt: 0,
          },
          rules: [],
        },
      };

      expect(importBlockerSnapshot(snapshot)).toEqual(createEmptyBlockerState());
    });

    it("normalizes imported hosts and patterns from raw snapshot data", () => {
      const snapshot: BlockerExport = {
        version: 1,
        exportedAt: "2026-04-01T00:00:00.000Z",
        state: {
          settings: {
            enabled: true,
            activationMode: "always",
            permissionGranted: true,
            updatedAt: 123,
          },
          rules: [
            {
              id: "youtube",
              pattern: "https://WWW.YouTube.com/watch?v=123",
              enabled: true,
              source: "custom",
              createdAt: 123,
              updatedAt: 123,
            },
          ],
          bypassGrants: [
            {
              pattern: "HTTPS://m.Reddit.com/r/typescript",
              originalUrl: "https://www.reddit.com/r/typescript",
              createdAt: 123,
              expiresAt: 456,
            },
          ],
          events: [
            {
              id: "event-1",
              type: "blocked",
              pattern: "https://X.com/home",
              occurredAt: "2026-04-01T00:00:00.000Z",
            },
          ],
          sessions: [
            {
              id: "session-1",
              host: "HTTPS://News.YCombinator.com/item?id=1",
              url: "https://news.ycombinator.com/item?id=1",
              startedAt: "2026-04-01T00:00:00.000Z",
              endedAt: "2026-04-01T00:05:00.000Z",
              durationMs: 300_000,
              tabId: 1,
              wasBlockedRuleMatch: false,
              occurredDuringBypass: false,
            },
          ],
          dailyAggregates: [
            {
              date: "2026-04-01",
              host: "HTTP://WWW.LinkedIn.com/feed",
              totalDurationMs: 300_000,
              visits: 2,
              blockedAttempts: 1,
              bypassSessions: 0,
            },
          ],
        },
      };

      const imported = importBlockerSnapshot(snapshot);

      expect(imported.rules[0]?.pattern).toBe("youtube.com");
      expect(imported.bypassGrants[0]?.pattern).toBe("m.reddit.com");
      expect(imported.events[0]?.pattern).toBe("x.com");
      expect(imported.sessions[0]?.host).toBe("news.ycombinator.com");
      expect(imported.dailyAggregates[0]?.host).toBe("linkedin.com");
    });
  });
});
