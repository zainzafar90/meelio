import type {
  ActivationMode,
  BlockRuleSource,
  BlockerExport,
  BlockerState,
  TimerStage,
} from "./blocker-core";
import type { ActivitySnapshot } from "./blocker-state";
export {
  BLOCKER_REQUIRED_ORIGINS,
  requestBlockerAccessPermission,
} from "../../../utils/extension-permissions";

export const BLOCKER_STORAGE_KEY = "meelio:extension:blocker-state.v1";
export const BLOCKER_BYPASS_ALARM_NAME =
  "meelio:extension:blocker-bypass-expiry.v1";

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
  "blocker/set-timer-state": TrackingMutationResponse;
  "tracking/session-update": TrackingMutationResponse;
  "tracking/session-end": TrackingMutationResponse;
  "tracking/get-activity": ActivitySnapshot;
}

export type ExtensionCommandResponse<T extends ExtensionCommandType> =
  ExtensionCommandResponseMap[T];

const extensionCommandTypes = new Set<ExtensionCommandType>([
  "blocker/get-state",
  "blocker/set-enabled",
  "blocker/set-activation-mode",
  "blocker/add-rule",
  "blocker/remove-rule",
  "blocker/toggle-rule",
  "blocker/request-host-access",
  "blocker/start-bypass",
  "blocker/end-bypass",
  "blocker/export",
  "blocker/import",
  "blocker/record-blocked",
  "blocker/set-timer-state",
  "tracking/session-update",
  "tracking/session-end",
  "tracking/get-activity",
]);

export const isExtensionCommand = (
  value: unknown
): value is ExtensionCommand => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { type?: string };
  return (
    typeof candidate.type === "string" &&
    extensionCommandTypes.has(candidate.type as ExtensionCommandType)
  );
};

export const sendExtensionCommand = async <T extends ExtensionCommandType>(
  command: ExtensionCommandFor<T>
): Promise<ExtensionCommandResponse<T>> =>
  chrome.runtime.sendMessage(
    command
  ) as Promise<ExtensionCommandResponse<T>>;
