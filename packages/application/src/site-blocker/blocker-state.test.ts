import { describe, expect, it } from "vitest";

import {
  addOrEnableRule,
  buildActivitySnapshot,
  clearActivityHistory,
  clearBypassForPattern,
  removeRule,
  setActivationMode,
  setBlockerEnabled,
  startBypassForPattern,
  toggleRule,
} from "./blocker-state";
import {
  createBlockRule,
  createEmptyBlockerState,
  type BlockerState,
} from "../../../core/src/site-blocker";

describe("blocker-state", () => {
  it("re-enables an existing matching rule instead of duplicating it", () => {
    const state = createEmptyBlockerState();
    state.rules = [
      createBlockRule({
        id: "youtube",
        pattern: "youtube.com",
        source: "preset",
        enabled: false,
      }),
    ];

    const nextState = addOrEnableRule(state, {
      id: "youtube",
      pattern: "www.youtube.com",
      source: "preset",
      now: 5_000,
    });

    expect(nextState.rules).toEqual([
      {
        ...state.rules[0],
        enabled: true,
        updatedAt: 5_000,
      },
    ]);
  });

  it("adds a new rule when the pattern is not present", () => {
    const nextState = addOrEnableRule(createEmptyBlockerState(), {
      id: "reddit",
      pattern: "reddit.com",
      source: "custom",
      now: 9_000,
    });

    expect(nextState.rules).toEqual([
      {
        id: "reddit",
        pattern: "reddit.com",
        source: "custom",
        enabled: true,
        createdAt: 9_000,
        updatedAt: 9_000,
      },
    ]);
  });

  it("toggles rules by id", () => {
    const state = createEmptyBlockerState();
    state.rules = [
      createBlockRule({
        id: "discord",
        pattern: "discord.com",
        source: "preset",
        enabled: true,
        createdAt: 1_000,
        updatedAt: 1_000,
      }),
    ];

    const nextState = toggleRule(state, "discord", 10_000);

    expect(nextState.rules[0]).toEqual({
      ...state.rules[0],
      enabled: false,
      updatedAt: 10_000,
    });
  });

  it("removes custom rules completely", () => {
    const state = createEmptyBlockerState();
    state.rules = [
      createBlockRule({
        id: "custom-1",
        pattern: "news.example.com",
        source: "custom",
      }),
    ];

    expect(removeRule(state, "custom-1").rules).toEqual([]);
  });

  it("starts and clears a per-site bypass", () => {
    const state = createEmptyBlockerState();

    const bypassed = startBypassForPattern(state, {
      pattern: "youtube.com",
      originalUrl: "https://youtube.com/watch?v=123",
      durationMinutes: 15,
      now: 60_000,
    });

    expect(bypassed.bypassGrants).toEqual([
      {
        pattern: "youtube.com",
        originalUrl: "https://youtube.com/watch?v=123",
        createdAt: 60_000,
        expiresAt: 960_000,
      },
    ]);

    expect(clearBypassForPattern(bypassed, "youtube.com").bypassGrants).toEqual(
      []
    );
  });

  it("updates blocker settings", () => {
    let state = createEmptyBlockerState();
    state = setBlockerEnabled(state, false, 1_000);
    state = setActivationMode(state, "focus-only", 2_000);

    expect(state.settings).toEqual({
      enabled: false,
      activationMode: "focus-only",
      permissionGranted: false,
      updatedAt: 2_000,
    });
  });

  it("builds activity data from recent state", () => {
    const state: BlockerState = {
      ...createEmptyBlockerState(),
      events: [
        {
          id: "event-1",
          type: "blocked",
          pattern: "youtube.com",
          occurredAt: "2026-03-31T09:00:00.000Z",
        },
      ],
      sessions: [
        {
          id: "session-1",
          host: "youtube.com",
          url: "https://youtube.com/watch?v=123",
          startedAt: "2026-03-31T08:00:00.000Z",
          endedAt: "2026-03-31T08:20:00.000Z",
          durationMs: 1_200_000,
          tabId: 3,
          wasBlockedRuleMatch: true,
          occurredDuringBypass: false,
        },
      ],
      dailyAggregates: [
        {
          date: "2026-03-31",
          host: "youtube.com",
          totalDurationMs: 1_200_000,
          visits: 2,
          blockedAttempts: 1,
          bypassSessions: 0,
        },
        {
          date: "2026-03-25",
          host: "reddit.com",
          totalDurationMs: 600_000,
          visits: 1,
          blockedAttempts: 0,
          bypassSessions: 0,
        },
      ],
    };

    expect(
      buildActivitySnapshot(state, Date.parse("2026-03-31T12:00:00.000Z"))
    ).toEqual({
      recentEvents: state.events,
      recentSessions: state.sessions,
      topSites: [
        {
          host: "youtube.com",
          totalDurationMs: 1_200_000,
          visits: 2,
          blockedAttempts: 1,
          bypassSessions: 0,
        },
        {
          host: "reddit.com",
          totalDurationMs: 600_000,
          visits: 1,
          blockedAttempts: 0,
          bypassSessions: 0,
        },
      ],
    });
  });

  it("clears usage history without removing blocker configuration", () => {
    const state: BlockerState = {
      ...createEmptyBlockerState(),
      settings: {
        enabled: true,
        activationMode: "always",
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
      bypassGrants: [
        {
          pattern: "youtube.com",
          originalUrl: "https://youtube.com/watch?v=1",
          createdAt: 50,
          expiresAt: 500,
        },
      ],
      events: [
        {
          id: "event-1",
          type: "blocked",
          pattern: "youtube.com",
          occurredAt: "2026-03-31T09:00:00.000Z",
        },
      ],
      sessions: [
        {
          id: "session-1",
          host: "youtube.com",
          url: "https://youtube.com/watch?v=123",
          startedAt: "2026-03-31T08:00:00.000Z",
          endedAt: "2026-03-31T08:20:00.000Z",
          durationMs: 1_200_000,
          tabId: 3,
          wasBlockedRuleMatch: true,
          occurredDuringBypass: false,
        },
      ],
      dailyAggregates: [
        {
          date: "2026-03-31",
          host: "youtube.com",
          totalDurationMs: 1_200_000,
          visits: 2,
          blockedAttempts: 1,
          bypassSessions: 0,
        },
      ],
    };

    expect(clearActivityHistory(state)).toEqual({
      ...state,
      events: [],
      sessions: [],
      dailyAggregates: [],
    });
  });
});
