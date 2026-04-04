export type ActivationMode = "always" | "focus-only";
export type BlockRuleSource = "custom" | "preset";
export type BlockerEventType =
  | "blocked"
  | "bypass_started"
  | "bypass_ended"
  | "permission_denied";
export type TimerStage = "focus" | "break";

export interface BlockRule {
  id: string;
  pattern: string;
  enabled: boolean;
  source: BlockRuleSource;
  createdAt: number;
  updatedAt: number;
}

export interface BlockerSettings {
  enabled: boolean;
  activationMode: ActivationMode;
  permissionGranted: boolean;
  updatedAt: number;
}

export interface BypassGrant {
  pattern: string;
  expiresAt: number;
  originalUrl: string;
  createdAt: number;
}

export interface BlockerEvent {
  id: string;
  type: BlockerEventType;
  pattern: string;
  originalUrl?: string;
  occurredAt: string;
}

export interface BrowsingSession {
  id: string;
  host: string;
  url: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  tabId: number;
  wasBlockedRuleMatch: boolean;
  occurredDuringBypass: boolean;
}

export interface DailySiteAggregate {
  date: string;
  host: string;
  totalDurationMs: number;
  visits: number;
  blockedAttempts: number;
  bypassSessions: number;
}

export interface BlockerState {
  settings: BlockerSettings;
  rules: BlockRule[];
  bypassGrants: BypassGrant[];
  events: BlockerEvent[];
  sessions: BrowsingSession[];
  dailyAggregates: DailySiteAggregate[];
}

export interface BlockerExport {
  version: number;
  exportedAt: string;
  state: Partial<BlockerState> & Pick<BlockerState, "settings" | "rules">;
}

export interface BlockingContext {
  timerStage: TimerStage;
}

export interface BlockDecisionContext extends BlockingContext {
  url: string;
  now: number;
}

export interface DynamicRulePatternContext extends BlockingContext {
  now: number;
}

export interface BlockDecision {
  shouldBlock: boolean;
  matchedRule: BlockRule | null;
  bypass: BypassGrant | null;
}

export interface ActivitySnapshot {
  recentEvents: BlockerEvent[];
  recentSessions: BrowsingSession[];
  topSites: Array<Omit<DailySiteAggregate, "date">>;
}

export interface TrackingSessionPayload {
  sessionId: string;
  url: string;
  host: string;
  startedAt: string;
  observedAt: string;
  durationMs: number;
  endedAt?: string;
}

export interface BlockerGetStateCommand {
  type: "blocker/get-state";
}

export interface BlockerSetEnabledCommand {
  type: "blocker/set-enabled";
  payload: {
    enabled: boolean;
  };
}

export interface BlockerSetActivationModeCommand {
  type: "blocker/set-activation-mode";
  payload: {
    activationMode: ActivationMode;
  };
}

export interface BlockerAddRuleCommand {
  type: "blocker/add-rule";
  payload: {
    id: string;
    pattern: string;
    source: BlockRuleSource;
  };
}

export interface BlockerRemoveRuleCommand {
  type: "blocker/remove-rule";
  payload: {
    id: string;
  };
}

export interface BlockerToggleRuleCommand {
  type: "blocker/toggle-rule";
  payload: {
    id: string;
  };
}

export interface BlockerRequestHostAccessCommand {
  type: "blocker/request-host-access";
}

export interface BlockerStartBypassCommand {
  type: "blocker/start-bypass";
  payload: {
    pattern: string;
    durationMinutes: number;
  };
}

export interface BlockerEndBypassCommand {
  type: "blocker/end-bypass";
  payload: {
    pattern: string;
  };
}

export interface BlockerExportCommand {
  type: "blocker/export";
}

export interface BlockerImportCommand {
  type: "blocker/import";
  payload: {
    snapshot: BlockerExport;
  };
}

export interface BlockerRecordBlockedCommand {
  type: "blocker/record-blocked";
  payload: {
    pattern: string;
  };
}

export interface BlockerClearActivityCommand {
  type: "blocker/clear-activity";
}

export interface BlockerSetTimerStateCommand {
  type: "blocker/set-timer-state";
  payload: {
    stage: TimerStage;
    isRunning: boolean;
  };
}

export interface TrackingSessionUpdateCommand {
  type: "tracking/session-update";
  payload: TrackingSessionPayload;
}

export interface TrackingSessionEndCommand {
  type: "tracking/session-end";
  payload: TrackingSessionPayload;
}

export interface TrackingGetActivityCommand {
  type: "tracking/get-activity";
}

export type ExtensionCommand =
  | BlockerGetStateCommand
  | BlockerSetEnabledCommand
  | BlockerSetActivationModeCommand
  | BlockerAddRuleCommand
  | BlockerRemoveRuleCommand
  | BlockerToggleRuleCommand
  | BlockerRequestHostAccessCommand
  | BlockerStartBypassCommand
  | BlockerEndBypassCommand
  | BlockerExportCommand
  | BlockerImportCommand
  | BlockerRecordBlockedCommand
  | BlockerClearActivityCommand
  | BlockerSetTimerStateCommand
  | TrackingSessionUpdateCommand
  | TrackingSessionEndCommand
  | TrackingGetActivityCommand;

export type ExtensionCommandType = ExtensionCommand["type"];
export type ExtensionCommandFor<T extends ExtensionCommandType> = Extract<
  ExtensionCommand,
  { type: T }
>;

interface MutationStateResponse {
  state: BlockerState;
}

export interface BlockerRequestHostAccessResponse extends MutationStateResponse {
  granted: boolean;
}

export interface BlockerStartBypassResponse extends MutationStateResponse {
  continueUrl: string | null;
}

export interface TrackingMutationResponse {
  ok: true;
}

export interface ExtensionCommandResponseMap {
  "blocker/get-state": MutationStateResponse;
  "blocker/set-enabled": MutationStateResponse;
  "blocker/set-activation-mode": MutationStateResponse;
  "blocker/add-rule": MutationStateResponse;
  "blocker/remove-rule": MutationStateResponse;
  "blocker/toggle-rule": MutationStateResponse;
  "blocker/request-host-access": BlockerRequestHostAccessResponse;
  "blocker/start-bypass": BlockerStartBypassResponse;
  "blocker/end-bypass": MutationStateResponse;
  "blocker/export": BlockerExport;
  "blocker/import": MutationStateResponse;
  "blocker/record-blocked": MutationStateResponse;
  "blocker/clear-activity": MutationStateResponse;
  "blocker/set-timer-state": TrackingMutationResponse;
  "tracking/session-update": TrackingMutationResponse;
  "tracking/session-end": TrackingMutationResponse;
  "tracking/get-activity": ActivitySnapshot;
}

export type ExtensionCommandResponse<T extends ExtensionCommandType> =
  ExtensionCommandResponseMap[T];
