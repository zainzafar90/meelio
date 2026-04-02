import {
  TimerStage,
  getNextTimerStage,
  type TimerMessage,
} from "@repo/timer-core";
import { defineBackground } from "wxt/utils/define-background";

import {
  BLOCKER_BYPASS_ALARM_NAME,
  BLOCKER_STORAGE_KEY,
  isExtensionCommand,
  type BlockerRecordBlockedCommand,
  type BlockerStartBypassCommand,
  type ExtensionCommand,
  type TrackingSessionPayload,
} from "../features/site-blocker/services/blocker-runtime";
import {
  applyCompletedSession,
  buildBlockerExport,
  buildDynamicRules,
  cleanupBlockerData,
  createEmptyBlockerState,
  getBlockDecision,
  importBlockerSnapshot,
  BLOCKER_EXPORT_VERSION,
  type BlockerEventType,
  type BlockerState,
  type BrowsingSession,
} from "../features/site-blocker/services/blocker-core";
import {
  addOrEnableRule,
  appendBlockerEvent,
  buildActivitySnapshot,
  clearActivityHistory,
  clearBypassForPattern,
  removeRule,
  setActivationMode,
  setBlockerEnabled,
  setPermissionGranted,
  startBypassForPattern,
  toggleRule,
} from "../features/site-blocker/services/blocker-state";
import { normalizeSiteHost } from "../utils/site-blocker.utils";
import { hasBlockerAccessPermission } from "../utils/extension-permissions";

interface TimerControllerState {
  stage: TimerStage;
  isRunning: boolean;
}

interface LiveSessionDraft {
  id: string;
  tabId: number;
  url: string;
  host: string;
  startedAt: string;
  lastObservedAt: string;
  durationMs: number;
  wasBlockedRuleMatch: boolean;
  occurredDuringBypass: boolean;
}

const newtabUrl = chrome.runtime.getURL("newtab.html");
const blockedPageUrl = chrome.runtime.getURL("blocked.html");

const timerState: TimerControllerState = {
  stage: TimerStage.Focus,
  isRunning: false,
};

let blockerMutationQueue: Promise<unknown> = Promise.resolve();
let blockerStateCache: BlockerState | null = null;
let timerInterval: ReturnType<typeof setInterval> | null = null;
let timerEndTime = 0;

const liveSessionsByTabId = new Map<number, LiveSessionDraft>();
const originalUrlByTabId = new Map<number, string>();

const toStoredState = async (): Promise<BlockerState> => {
  const result = await chrome.storage.local.get(BLOCKER_STORAGE_KEY);
  const rawState = result[BLOCKER_STORAGE_KEY];

  if (!rawState) {
    return createEmptyBlockerState();
  }

  return importBlockerSnapshot({
    version: BLOCKER_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    state: rawState as BlockerState,
  });
};

const getEffectiveTimerStage = (): "focus" | "break" =>
  timerState.isRunning && timerState.stage === TimerStage.Focus
    ? "focus"
    : "break";

const persistBlockerState = async (state: BlockerState): Promise<void> => {
  blockerStateCache = state;
  await chrome.storage.local.set({
    [BLOCKER_STORAGE_KEY]: state,
  });
};

const syncBypassAlarm = async (state: BlockerState): Promise<void> => {
  const nextExpiry = state.bypassGrants.reduce<number | null>(
    (earliest, grant) =>
      earliest === null ? grant.expiresAt : Math.min(earliest, grant.expiresAt),
    null
  );

  if (nextExpiry === null) {
    await chrome.alarms.clear(BLOCKER_BYPASS_ALARM_NAME);
    return;
  }

  chrome.alarms.create(BLOCKER_BYPASS_ALARM_NAME, {
    when: nextExpiry,
  });
};

const syncDynamicRules = async (state: BlockerState): Promise<void> => {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const nextRules = buildDynamicRules(state, {
    blockedPageUrl,
    timerStage: getEffectiveTimerStage(),
    now: Date.now(),
  });

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRules.map((rule) => rule.id),
    addRules: nextRules,
  });
};

const reconcileAndPersistState = async (
  state: BlockerState
): Promise<BlockerState> => {
  const now = Date.now();
  const permissionGranted = await hasBlockerAccessPermission();
  const cleanedState = cleanupBlockerData(state, now);
  const reconciledState =
    cleanedState.settings.permissionGranted === permissionGranted
      ? cleanedState
      : setPermissionGranted(cleanedState, permissionGranted, now);

  await persistBlockerState(reconciledState);
  await syncBypassAlarm(reconciledState);
  await syncDynamicRules(reconciledState);
  return reconciledState;
};

const ensureBlockerState = async (): Promise<BlockerState> => {
  if (blockerStateCache) {
    return blockerStateCache;
  }

  blockerStateCache = await toStoredState();
  return blockerStateCache;
};

const refreshBlockerState = async (): Promise<BlockerState> =>
  reconcileAndPersistState(await ensureBlockerState());

const runBlockerMutation = async (
  mutate: (state: BlockerState) => BlockerState | Promise<BlockerState>
): Promise<BlockerState> => {
  const run = blockerMutationQueue.then(
    async () => {
      const currentState = await ensureBlockerState();
      const nextState = await mutate(currentState);
      return reconcileAndPersistState(nextState);
    },
    async () => {
      const currentState = await ensureBlockerState();
      const nextState = await mutate(currentState);
      return reconcileAndPersistState(nextState);
    }
  );

  blockerMutationQueue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
};

const createBlockerEvent = (
  type: BlockerEventType,
  pattern: string,
  originalUrl?: string
) => ({
  id: crypto.randomUUID(),
  type,
  pattern: normalizeSiteHost(pattern),
  ...(originalUrl ? { originalUrl } : {}),
  occurredAt: new Date().toISOString(),
});

const isTrackableUrl = (url: string): boolean =>
  url.startsWith("http://") || url.startsWith("https://");

const updateOriginalUrl = (tabId: number, url?: string): void => {
  if (!url || !isTrackableUrl(url)) {
    return;
  }

  originalUrlByTabId.set(tabId, url);
};

const upsertLiveSession = async (
  sender: chrome.runtime.MessageSender,
  payload: TrackingSessionPayload
): Promise<void> => {
  const tabId = sender.tab?.id;
  if (typeof tabId !== "number" || !isTrackableUrl(payload.url)) {
    return;
  }

  updateOriginalUrl(tabId, payload.url);

  const state = await ensureBlockerState();
  const decision = getBlockDecision(state, {
    url: payload.url,
    timerStage: getEffectiveTimerStage(),
    now: Date.now(),
  });
  const existingDraft = liveSessionsByTabId.get(tabId);

  liveSessionsByTabId.set(tabId, {
    id: payload.sessionId,
    tabId,
    url: payload.url,
    host: normalizeSiteHost(payload.host),
    startedAt: payload.startedAt,
    lastObservedAt: payload.observedAt,
    durationMs: Math.max(existingDraft?.durationMs ?? 0, payload.durationMs),
    wasBlockedRuleMatch:
      (existingDraft?.wasBlockedRuleMatch ?? false) ||
      Boolean(decision.matchedRule),
    occurredDuringBypass:
      (existingDraft?.occurredDuringBypass ?? false) || Boolean(decision.bypass),
  });
};

const finalizeLiveSession = async (
  sender: chrome.runtime.MessageSender,
  payload?: TrackingSessionPayload
): Promise<void> => {
  const tabId = sender.tab?.id;
  if (typeof tabId !== "number") {
    return;
  }

  const existingDraft = liveSessionsByTabId.get(tabId);
  const resolvedUrl = payload?.url ?? existingDraft?.url;
  if (!resolvedUrl || !isTrackableUrl(resolvedUrl)) {
    liveSessionsByTabId.delete(tabId);
    return;
  }

  const currentState = await ensureBlockerState();
  const decision = getBlockDecision(currentState, {
    url: resolvedUrl,
    timerStage: getEffectiveTimerStage(),
    now: Date.now(),
  });

  const draft: LiveSessionDraft = existingDraft ?? {
    id: payload?.sessionId ?? crypto.randomUUID(),
    tabId,
    url: resolvedUrl,
    host: normalizeSiteHost(payload?.host ?? new URL(resolvedUrl).hostname),
    startedAt: payload?.startedAt ?? new Date().toISOString(),
    lastObservedAt: payload?.observedAt ?? new Date().toISOString(),
    durationMs: payload?.durationMs ?? 0,
    wasBlockedRuleMatch: Boolean(decision.matchedRule),
    occurredDuringBypass: Boolean(decision.bypass),
  };

  const endedAt = payload?.endedAt ?? payload?.observedAt ?? new Date().toISOString();
  const durationMs = Math.max(draft.durationMs, payload?.durationMs ?? 0);

  liveSessionsByTabId.delete(tabId);

  if (durationMs <= 0) {
    return;
  }

  const session: BrowsingSession = {
    id: draft.id,
    host: draft.host,
    url: resolvedUrl,
    startedAt: draft.startedAt,
    endedAt,
    durationMs,
    tabId,
    wasBlockedRuleMatch: draft.wasBlockedRuleMatch || Boolean(decision.matchedRule),
    occurredDuringBypass:
      draft.occurredDuringBypass || Boolean(decision.bypass),
  };

  await runBlockerMutation((state) => applyCompletedSession(state, session));
};

const flushLiveSessionForTab = async (tabId: number): Promise<void> => {
  const draft = liveSessionsByTabId.get(tabId);
  if (!draft) {
    return;
  }

  liveSessionsByTabId.delete(tabId);

  if (draft.durationMs <= 0) {
    return;
  }

  await runBlockerMutation((state) =>
    applyCompletedSession(state, {
      id: draft.id,
      host: draft.host,
      url: draft.url,
      startedAt: draft.startedAt,
      endedAt: draft.lastObservedAt,
      durationMs: draft.durationMs,
      tabId,
      wasBlockedRuleMatch: draft.wasBlockedRuleMatch,
      occurredDuringBypass: draft.occurredDuringBypass,
    })
  );
};

const cleanTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = null;
  timerEndTime = 0;
};

const remaining = (): number =>
  Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));

const syncRulesForTimerState = async (): Promise<void> => {
  const state = await ensureBlockerState();
  await reconcileAndPersistState(state);
};

const handleTimerMessage = (message: TimerMessage): void => {
  switch (message.type) {
    case "START":
      cleanTimer();
      timerState.stage = message.stage;
      timerState.isRunning = true;
      timerEndTime = Date.now() + message.duration * 1000;
      chrome.runtime.sendMessage({
        type: "TICK",
        remaining: message.duration,
      });
      void syncRulesForTimerState();
      timerInterval = setInterval(() => {
        const left = remaining();
        if (left <= 0) {
          const finishedStage = timerState.stage;
          timerState.stage = getNextTimerStage(timerState.stage);
          timerState.isRunning = false;
          chrome.runtime.sendMessage({
            type: "TICK",
            remaining: 0,
          });
          chrome.runtime.sendMessage({
            type: "STAGE_COMPLETE",
            finishedStage,
          });
          cleanTimer();
          void syncRulesForTimerState();
        } else {
          chrome.runtime.sendMessage({
            type: "TICK",
            remaining: left,
          });
        }
      }, 1000);
      break;
    case "PAUSE":
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      timerState.isRunning = false;
      chrome.runtime.sendMessage({
        type: "PAUSED",
        remaining: remaining(),
      });
      void syncRulesForTimerState();
      break;
    case "RESET":
      cleanTimer();
      timerState.stage = message.stage;
      timerState.isRunning = false;
      chrome.runtime.sendMessage({ type: "RESET_COMPLETE" });
      void syncRulesForTimerState();
      break;
    case "UPDATE_DURATION":
      timerEndTime = Date.now() + message.duration * 1000;
      break;
    case "SKIP_TO_NEXT_STAGE":
      cleanTimer();
      timerState.stage = message.nextStage;
      timerState.isRunning = false;
      void syncRulesForTimerState();
      break;
  }
};

const recordBlockedAttempt = async (
  sender: chrome.runtime.MessageSender,
  command: BlockerRecordBlockedCommand
): Promise<BlockerState> => {
  const tabId = sender.tab?.id;
  const originalUrl =
    typeof tabId === "number" ? originalUrlByTabId.get(tabId) : undefined;

  return runBlockerMutation((state) =>
    appendBlockerEvent(
      state,
      createBlockerEvent("blocked", command.payload.pattern, originalUrl)
    )
  );
};

const startBypass = async (
  sender: chrome.runtime.MessageSender,
  command: BlockerStartBypassCommand
): Promise<{ state: BlockerState; continueUrl: string | null }> => {
  const tabId = sender.tab?.id;
  const continueUrl =
    typeof tabId === "number"
      ? originalUrlByTabId.get(tabId) ?? null
      : null;

  const nextState = await runBlockerMutation((state) => {
    const bypassedState = startBypassForPattern(state, {
      pattern: command.payload.pattern,
      originalUrl: continueUrl ?? `https://${normalizeSiteHost(command.payload.pattern)}`,
      durationMinutes: command.payload.durationMinutes,
      now: Date.now(),
    });

    return appendBlockerEvent(
      bypassedState,
      createBlockerEvent(
        "bypass_started",
        command.payload.pattern,
        continueUrl ?? undefined
      )
    );
  });

  return {
    state: nextState,
    continueUrl,
  };
};

const handleExtensionCommand = async (
  command: ExtensionCommand,
  sender: chrome.runtime.MessageSender
) => {
  switch (command.type) {
    case "blocker/get-state":
      return { state: await refreshBlockerState() };
    case "blocker/set-enabled":
      return {
        state: await runBlockerMutation((state) =>
          setBlockerEnabled(state, command.payload.enabled, Date.now())
        ),
      };
    case "blocker/set-activation-mode":
      return {
        state: await runBlockerMutation((state) =>
          setActivationMode(state, command.payload.activationMode, Date.now())
        ),
      };
    case "blocker/add-rule":
      return {
        state: await runBlockerMutation((state) =>
          addOrEnableRule(state, {
            ...command.payload,
            now: Date.now(),
          })
        ),
      };
    case "blocker/remove-rule":
      return {
        state: await runBlockerMutation((state) =>
          removeRule(state, command.payload.id)
        ),
      };
    case "blocker/toggle-rule":
      return {
        state: await runBlockerMutation((state) =>
          toggleRule(state, command.payload.id, Date.now())
        ),
      };
    case "blocker/request-host-access": {
      const granted = await hasBlockerAccessPermission();
      const state = await runBlockerMutation((currentState) => {
        let nextState = setPermissionGranted(currentState, granted, Date.now());
        if (!granted) {
          nextState = appendBlockerEvent(
            nextState,
            createBlockerEvent("permission_denied", "all-sites")
          );
        }
        return nextState;
      });

      return {
        state,
        granted,
      };
    }
    case "blocker/start-bypass":
      return startBypass(sender, command);
    case "blocker/end-bypass":
      return {
        state: await runBlockerMutation((state) =>
          appendBlockerEvent(
            clearBypassForPattern(state, command.payload.pattern),
            createBlockerEvent("bypass_ended", command.payload.pattern)
          )
        ),
      };
    case "blocker/export":
      return buildBlockerExport(await refreshBlockerState(), new Date().toISOString());
    case "blocker/import":
      return {
        state: await runBlockerMutation(async () => {
          const imported = importBlockerSnapshot(command.payload.snapshot);
          const permissionGranted = await hasBlockerAccessPermission();
          return setPermissionGranted(imported, permissionGranted, Date.now());
        }),
      };
    case "blocker/record-blocked":
      return {
        state: await recordBlockedAttempt(sender, command),
      };
    case "blocker/clear-activity":
      return {
        state: await runBlockerMutation((state) => clearActivityHistory(state)),
      };
    case "blocker/set-timer-state":
      timerState.stage =
        command.payload.stage === "focus" ? TimerStage.Focus : TimerStage.Break;
      timerState.isRunning = command.payload.isRunning;
      await syncRulesForTimerState();
      return { ok: true as const };
    case "tracking/session-update":
      await upsertLiveSession(sender, command.payload);
      return { ok: true as const };
    case "tracking/session-end":
      await finalizeLiveSession(sender, command.payload);
      return { ok: true as const };
    case "tracking/get-activity":
      return buildActivitySnapshot(await refreshBlockerState(), Date.now());
  }
};

export default defineBackground(() => {
  void refreshBlockerState();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (
      message &&
      typeof message === "object" &&
      typeof (message as { type?: string }).type === "string" &&
      ["START", "PAUSE", "RESET", "UPDATE_DURATION", "SKIP_TO_NEXT_STAGE"].includes(
        (message as { type: string }).type
      )
    ) {
      handleTimerMessage(message as TimerMessage);
      return;
    }

    if (!isExtensionCommand(message)) {
      return;
    }

    void handleExtensionCommand(message, sender)
      .then((result) => sendResponse(result))
      .catch((error) => {
        console.error("[meelio] background command failed", error);
        sendResponse({
          error:
            error instanceof Error ? error.message : "Unknown background error",
        });
      });

    return true;
  });

  chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: newtabUrl });
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== BLOCKER_BYPASS_ALARM_NAME) {
      return;
    }

    void runBlockerMutation((state) => {
      const now = Date.now();
      const expiredPatterns = state.bypassGrants
        .filter((grant) => grant.expiresAt <= now)
        .map((grant) => grant.pattern);

      let nextState = cleanupBlockerData(state, now);
      for (const pattern of expiredPatterns) {
        nextState = appendBlockerEvent(
          nextState,
          createBlockerEvent("bypass_ended", pattern)
        );
      }

      return nextState;
    });
  });

  chrome.permissions.onAdded.addListener(() => {
    void refreshBlockerState();
  });

  chrome.permissions.onRemoved.addListener(() => {
    void refreshBlockerState();
  });

  chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.frameId !== 0 || !isTrackableUrl(details.url)) {
      return;
    }

    updateOriginalUrl(details.tabId, details.url);
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    void flushLiveSessionForTab(tabId);
    originalUrlByTabId.delete(tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
      updateOriginalUrl(tabId, changeInfo.url);
    }
  });
});
