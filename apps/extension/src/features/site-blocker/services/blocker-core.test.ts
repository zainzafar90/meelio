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
          source: "preset",
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
    it("removes expired raw sessions, events, aggregates, and bypasses", () => {
      const now = Date.parse("2026-03-31T12:00:00.000Z");
      const staleSession: BrowsingSession = {
        id: "old-session",
        host: "example.com",
        url: "https://example.com",
        startedAt: "2026-02-20T09:00:00.000Z",
        endedAt: "2026-02-20T09:01:00.000Z",
        durationMs: 60_000,
        tabId: 1,
        wasBlockedRuleMatch: false,
        occurredDuringBypass: false,
      };
      const freshSession: BrowsingSession = {
        ...staleSession,
        id: "fresh-session",
        startedAt: "2026-03-31T09:00:00.000Z",
        endedAt: "2026-03-31T09:10:00.000Z",
      };
      const staleEvent: BlockerEvent = {
        id: "old-event",
        type: "blocked",
        pattern: "example.com",
        occurredAt: "2025-12-01T00:00:00.000Z",
      };
      const freshEvent: BlockerEvent = {
        id: "fresh-event",
        type: "blocked",
        pattern: "youtube.com",
        occurredAt: "2026-03-31T10:00:00.000Z",
      };

      const state = createEmptyBlockerState();
      state.sessions = [staleSession, freshSession];
      state.events = [staleEvent, freshEvent];
      state.dailyAggregates = [
        {
          date: "2025-09-01",
          host: "example.com",
          totalDurationMs: 100,
          visits: 1,
          blockedAttempts: 0,
          bypassSessions: 0,
        },
        {
          date: "2026-03-31",
          host: "youtube.com",
          totalDurationMs: 300_000,
          visits: 1,
          blockedAttempts: 1,
          bypassSessions: 0,
        },
      ];
      state.bypassGrants = [
        createBypassGrant({
          pattern: "youtube.com",
          originalUrl: "https://youtube.com/watch?v=123",
          createdAt: now - 60_000,
          expiresAt: now - 1,
        }),
      ];

      const nextState = cleanupBlockerData(state, now);

      expect(nextState.sessions).toEqual([freshSession]);
      expect(nextState.events).toEqual([freshEvent]);
      expect(nextState.dailyAggregates).toEqual([
        {
          date: "2026-03-31",
          host: "youtube.com",
          totalDurationMs: 300_000,
          visits: 1,
          blockedAttempts: 1,
          bypassSessions: 0,
        },
      ]);
      expect(nextState.bypassGrants).toEqual([]);

      expect(RAW_SESSION_RETENTION_DAYS).toBe(30);
      expect(BLOCKER_EVENT_RETENTION_DAYS).toBe(90);
      expect(DAILY_AGGREGATE_RETENTION_DAYS).toBe(180);
    });
  });

  describe("export/import", () => {
    it("round-trips blocker state and restores defaults for missing collections", () => {
      const state = createEmptyBlockerState();
      state.rules = [
        createBlockRule({
          id: "discord",
          pattern: "discord.com",
          source: "preset",
        }),
      ];
      state.events = [
        {
          id: "evt-1",
          type: "blocked",
          pattern: "discord.com",
          occurredAt: "2026-03-31T11:00:00.000Z",
        },
      ];

      const exported = buildBlockerExport(state, "2026-03-31T12:00:00.000Z");
      const imported = importBlockerSnapshot(exported);

      expect(imported).toEqual(state);
    });

    it("accepts sparse imports and fills missing arrays", () => {
      const imported = importBlockerSnapshot({
        version: 1,
        exportedAt: "2026-03-31T12:00:00.000Z",
        state: {
          settings: {
            enabled: true,
            activationMode: "always",
            permissionGranted: false,
            updatedAt: 0,
          },
          rules: [],
        },
      } as BlockerExport);

      expect(imported).toEqual({
        ...createEmptyBlockerState(),
        settings: {
          enabled: true,
          activationMode: "always",
          permissionGranted: false,
          updatedAt: 0,
        },
      });
    });
  });
});
