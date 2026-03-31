import { normalizeSiteHost } from "../../../utils/site-blocker.utils";
import {
  createBlockRule,
  createBypassGrant,
  type ActivationMode,
  type BlockerEvent,
  type BlockRuleSource,
  type BlockerState,
  type DailySiteAggregate,
} from "./blocker-core";

export interface ActivitySnapshot {
  recentEvents: BlockerState["events"];
  recentSessions: BlockerState["sessions"];
  topSites: Omit<DailySiteAggregate, "date">[];
}

export const addOrEnableRule = (
  state: BlockerState,
  input: {
    id: string;
    pattern: string;
    source: BlockRuleSource;
    now: number;
  }
): BlockerState => {
  const normalizedPattern = normalizeSiteHost(input.pattern);
  const existingRule = state.rules.find(
    (rule) => rule.pattern === normalizedPattern
  );

  if (existingRule) {
    return {
      ...state,
      rules: state.rules.map((rule) =>
        rule.id === existingRule.id
          ? {
              ...rule,
              enabled: true,
              updatedAt: input.now,
            }
          : rule
      ),
    };
  }

  return {
    ...state,
    rules: [
      ...state.rules,
      createBlockRule({
        id: input.id,
        pattern: normalizedPattern,
        source: input.source,
        createdAt: input.now,
        updatedAt: input.now,
      }),
    ],
  };
};

export const toggleRule = (
  state: BlockerState,
  ruleId: string,
  now: number
): BlockerState => ({
  ...state,
  rules: state.rules.map((rule) =>
    rule.id === ruleId
      ? {
          ...rule,
          enabled: !rule.enabled,
          updatedAt: now,
        }
      : rule
  ),
});

export const removeRule = (
  state: BlockerState,
  ruleId: string
): BlockerState => ({
  ...state,
  rules: state.rules.filter((rule) => rule.id !== ruleId),
  bypassGrants: state.bypassGrants.filter((grant) => {
    const removedRule = state.rules.find((rule) => rule.id === ruleId);
    if (!removedRule) {
      return true;
    }

    return grant.pattern !== removedRule.pattern;
  }),
});

export const setBlockerEnabled = (
  state: BlockerState,
  enabled: boolean,
  now: number
): BlockerState => ({
  ...state,
  settings: {
    ...state.settings,
    enabled,
    updatedAt: now,
  },
});

export const setActivationMode = (
  state: BlockerState,
  activationMode: ActivationMode,
  now: number
): BlockerState => ({
  ...state,
  settings: {
    ...state.settings,
    activationMode,
    updatedAt: now,
  },
});

export const setPermissionGranted = (
  state: BlockerState,
  permissionGranted: boolean,
  now: number
): BlockerState => ({
  ...state,
  settings: {
    ...state.settings,
    permissionGranted,
    updatedAt: now,
  },
});

export const startBypassForPattern = (
  state: BlockerState,
  input: {
    pattern: string;
    originalUrl: string;
    durationMinutes: number;
    now: number;
  }
): BlockerState => {
  const pattern = normalizeSiteHost(input.pattern);
  const nextGrant = createBypassGrant({
    pattern,
    originalUrl: input.originalUrl,
    createdAt: input.now,
    expiresAt: input.now + input.durationMinutes * 60 * 1000,
  });

  return {
    ...state,
    bypassGrants: [
      ...state.bypassGrants.filter((grant) => grant.pattern !== pattern),
      nextGrant,
    ],
  };
};

export const clearBypassForPattern = (
  state: BlockerState,
  pattern: string
): BlockerState => {
  const normalizedPattern = normalizeSiteHost(pattern);
  return {
    ...state,
    bypassGrants: state.bypassGrants.filter(
      (grant) => grant.pattern !== normalizedPattern
    ),
  };
};

export const appendBlockerEvent = (
  state: BlockerState,
  event: BlockerEvent
): BlockerState => ({
  ...state,
  events: [...state.events, event],
});

const withinLastSevenDays = (date: string, now: number): boolean => {
  const timestamp = Date.parse(`${date}T23:59:59.999Z`);
  if (Number.isNaN(timestamp)) {
    return false;
  }

  return now - timestamp <= 7 * 24 * 60 * 60 * 1000;
};

export const buildActivitySnapshot = (
  state: BlockerState,
  now: number
): ActivitySnapshot => {
  const byHost = new Map<string, Omit<DailySiteAggregate, "date">>();

  for (const aggregate of state.dailyAggregates) {
    if (!withinLastSevenDays(aggregate.date, now)) {
      continue;
    }

    const existing = byHost.get(aggregate.host);
    if (!existing) {
      byHost.set(aggregate.host, {
        host: aggregate.host,
        totalDurationMs: aggregate.totalDurationMs,
        visits: aggregate.visits,
        blockedAttempts: aggregate.blockedAttempts,
        bypassSessions: aggregate.bypassSessions,
      });
      continue;
    }

    byHost.set(aggregate.host, {
      host: aggregate.host,
      totalDurationMs: existing.totalDurationMs + aggregate.totalDurationMs,
      visits: existing.visits + aggregate.visits,
      blockedAttempts: existing.blockedAttempts + aggregate.blockedAttempts,
      bypassSessions: existing.bypassSessions + aggregate.bypassSessions,
    });
  }

  return {
    recentEvents: [...state.events].sort((left, right) =>
      right.occurredAt.localeCompare(left.occurredAt)
    ),
    recentSessions: [...state.sessions].sort((left, right) =>
      right.endedAt.localeCompare(left.endedAt)
    ),
    topSites: [...byHost.values()].sort(
      (left, right) => right.totalDurationMs - left.totalDurationMs
    ),
  };
};
