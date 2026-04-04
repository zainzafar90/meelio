import type {
  BlockDecision,
  BlockDecisionContext,
  BlockerEvent,
  BlockerExport,
  BlockerSettings,
  BlockerState,
  BlockRule,
  BlockRuleSource,
  BrowsingSession,
  BypassGrant,
  DailySiteAggregate,
  DynamicRulePatternContext,
  TimerStage,
  BlockingContext,
  BlockerEventType,
  ActivationMode,
} from "@repo/contracts/site-blocker";
import { doesSiteHostMatch, normalizeSiteHost } from "./site-blocker.utils";

export const RAW_SESSION_RETENTION_DAYS = 30;
export const BLOCKER_EVENT_RETENTION_DAYS = 90;
export const DAILY_AGGREGATE_RETENTION_DAYS = 180;
export const BLOCKER_EXPORT_VERSION = 1;

const DAY_MS = 24 * 60 * 60 * 1000;

const createDefaultSettings = (): BlockerSettings => ({
  enabled: true,
  activationMode: "always",
  permissionGranted: false,
  updatedAt: 0,
});

export const createEmptyBlockerState = (): BlockerState => ({
  settings: createDefaultSettings(),
  rules: [],
  bypassGrants: [],
  events: [],
  sessions: [],
  dailyAggregates: [],
});

export const createBlockRule = ({
  id,
  pattern,
  source,
  enabled = true,
  createdAt = Date.now(),
  updatedAt = createdAt,
}: {
  id: string;
  pattern: string;
  source: BlockRuleSource;
  enabled?: boolean;
  createdAt?: number;
  updatedAt?: number;
}): BlockRule => ({
  id,
  pattern: normalizeSiteHost(pattern),
  enabled,
  source,
  createdAt,
  updatedAt,
});

export const createBypassGrant = ({
  pattern,
  expiresAt,
  originalUrl,
  createdAt = Date.now(),
}: {
  pattern: string;
  expiresAt: number;
  originalUrl: string;
  createdAt?: number;
}): BypassGrant => ({
  pattern: normalizeSiteHost(pattern),
  expiresAt,
  originalUrl,
  createdAt,
});

export const isBlockingActive = (
  settings: BlockerSettings,
  context: BlockingContext
): boolean => {
  if (!settings.enabled || !settings.permissionGranted) {
    return false;
  }

  if (settings.activationMode === "always") {
    return true;
  }

  return context.timerStage === "focus";
};

const getHostFromUrl = (url: string): string => {
  try {
    return normalizeSiteHost(new URL(url).hostname);
  } catch {
    return normalizeSiteHost(url);
  }
};

const pruneExpiredBypasses = (
  bypassGrants: BypassGrant[],
  now: number
): BypassGrant[] => bypassGrants.filter((grant) => grant.expiresAt > now);

const getMatchingRule = (rules: BlockRule[], host: string): BlockRule | null => {
  const enabledRules = rules.filter((rule) => rule.enabled);
  const sortedRules = [...enabledRules].sort(
    (left, right) => right.pattern.length - left.pattern.length
  );

  return (
    sortedRules.find((rule) => doesSiteHostMatch(host, rule.pattern)) ?? null
  );
};

const getActiveBypassGrant = (
  bypassGrants: BypassGrant[],
  host: string
): BypassGrant | null =>
  bypassGrants.find((grant) => doesSiteHostMatch(host, grant.pattern)) ?? null;

export const getBlockDecision = (
  state: BlockerState,
  context: BlockDecisionContext
): BlockDecision => {
  state.bypassGrants = pruneExpiredBypasses(state.bypassGrants, context.now);

  if (!isBlockingActive(state.settings, context)) {
    return {
      shouldBlock: false,
      matchedRule: null,
      bypass: null,
    };
  }

  const host = getHostFromUrl(context.url);
  const matchedRule = getMatchingRule(state.rules, host);

  if (!matchedRule) {
    return {
      shouldBlock: false,
      matchedRule: null,
      bypass: null,
    };
  }

  const bypass = getActiveBypassGrant(state.bypassGrants, host);
  if (bypass) {
    return {
      shouldBlock: false,
      matchedRule,
      bypass,
    };
  }

  return {
    shouldBlock: true,
    matchedRule,
    bypass: null,
  };
};

export const getDynamicRulePatterns = (
  state: BlockerState,
  context: DynamicRulePatternContext
): string[] => {
  state.bypassGrants = pruneExpiredBypasses(state.bypassGrants, context.now);

  if (!isBlockingActive(state.settings, context)) {
    return [];
  }

  const bypassedPatterns = new Set(
    state.bypassGrants.map((grant) => normalizeSiteHost(grant.pattern))
  );

  return state.rules
    .filter((rule) => rule.enabled && !bypassedPatterns.has(rule.pattern))
    .map((rule) => rule.pattern);
};

const toDayKey = (isoDate: string): string => isoDate.slice(0, 10);

export const applyCompletedSession = (
  state: BlockerState,
  session: BrowsingSession
): BlockerState => {
  const date = toDayKey(session.endedAt);
  const existing = state.dailyAggregates.find(
    (aggregate) => aggregate.date === date && aggregate.host === session.host
  );

  const nextAggregate: DailySiteAggregate = existing
    ? {
        ...existing,
        totalDurationMs: existing.totalDurationMs + session.durationMs,
        visits: existing.visits + 1,
        blockedAttempts:
          existing.blockedAttempts + Number(session.wasBlockedRuleMatch),
        bypassSessions:
          existing.bypassSessions + Number(session.occurredDuringBypass),
      }
    : {
        date,
        host: session.host,
        totalDurationMs: session.durationMs,
        visits: 1,
        blockedAttempts: Number(session.wasBlockedRuleMatch),
        bypassSessions: Number(session.occurredDuringBypass),
      };

  return {
    ...state,
    sessions: [...state.sessions, session],
    dailyAggregates: existing
      ? state.dailyAggregates.map((aggregate) =>
          aggregate.date === date && aggregate.host === session.host
            ? nextAggregate
            : aggregate
        )
      : [...state.dailyAggregates, nextAggregate],
  };
};

export const cleanupBlockerData = (
  state: BlockerState,
  now: number
): BlockerState => {
  const sessionCutoff = now - RAW_SESSION_RETENTION_DAYS * DAY_MS;
  const eventCutoff = now - BLOCKER_EVENT_RETENTION_DAYS * DAY_MS;
  const aggregateCutoff = now - DAILY_AGGREGATE_RETENTION_DAYS * DAY_MS;

  return {
    ...state,
    bypassGrants: pruneExpiredBypasses(state.bypassGrants, now),
    sessions: state.sessions.filter(
      (session) => Date.parse(session.endedAt) >= sessionCutoff
    ),
    events: state.events.filter(
      (event) => Date.parse(event.occurredAt) >= eventCutoff
    ),
    dailyAggregates: state.dailyAggregates.filter((aggregate) => {
      const timestamp = Date.parse(`${aggregate.date}T23:59:59.999Z`);
      return !Number.isNaN(timestamp) && timestamp >= aggregateCutoff;
    }),
  };
};

export const buildBlockerExport = (
  state: BlockerState,
  exportedAt: string
): BlockerExport => ({
  version: BLOCKER_EXPORT_VERSION,
  exportedAt,
  state: {
    settings: state.settings,
    rules: state.rules,
    bypassGrants: state.bypassGrants,
    events: state.events,
    sessions: state.sessions,
    dailyAggregates: state.dailyAggregates,
  },
});

const normalizeImportedRule = (rule: BlockRule): BlockRule => ({
  ...rule,
  pattern: normalizeSiteHost(rule.pattern),
});

const normalizeImportedBypassGrant = (grant: BypassGrant): BypassGrant => ({
  ...grant,
  pattern: normalizeSiteHost(grant.pattern),
});

const normalizeImportedEvent = (event: BlockerEvent): BlockerEvent => ({
  ...event,
  pattern: normalizeSiteHost(event.pattern),
});

const normalizeImportedSession = (
  session: BrowsingSession
): BrowsingSession => ({
  ...session,
  host: normalizeSiteHost(session.host),
});

const normalizeImportedAggregate = (
  aggregate: DailySiteAggregate
): DailySiteAggregate => ({
  ...aggregate,
  host: normalizeSiteHost(aggregate.host),
});

export const importBlockerSnapshot = (
  snapshot: BlockerExport
): BlockerState => ({
  ...createEmptyBlockerState(),
  ...snapshot.state,
  settings: {
    ...createDefaultSettings(),
    ...(snapshot.state.settings ?? {}),
  },
  rules: (snapshot.state.rules ?? []).map(normalizeImportedRule),
  bypassGrants: (snapshot.state.bypassGrants ?? []).map(
    normalizeImportedBypassGrant
  ),
  events: (snapshot.state.events ?? []).map(normalizeImportedEvent),
  sessions: (snapshot.state.sessions ?? []).map(normalizeImportedSession),
  dailyAggregates: (snapshot.state.dailyAggregates ?? []).map(
    normalizeImportedAggregate
  ),
});
