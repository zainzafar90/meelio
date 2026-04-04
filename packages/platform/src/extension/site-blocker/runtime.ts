import type {
  ExtensionCommand,
  ExtensionCommandFor,
  ExtensionCommandResponse,
  ExtensionCommandType,
} from "@repo/contracts/site-blocker";
import { getDynamicRulePatterns, type BlockerState } from "@repo/core/site-blocker";
import type { TimerStage } from "@repo/core/site-blocker";

export const BLOCKER_STORAGE_KEY = "meelio:extension:blocker-state.v1";
export const BLOCKER_BYPASS_ALARM_NAME =
  "meelio:extension:blocker-bypass-expiry.v1";

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
  "blocker/clear-activity",
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

export const buildExtensionDynamicRules = (
  state: BlockerState,
  context: {
    blockedPageUrl: string;
    timerStage: TimerStage;
    now: number;
  }
): chrome.declarativeNetRequest.Rule[] =>
  getDynamicRulePatterns(state, context).map((pattern, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        url: `${context.blockedPageUrl}?pattern=${pattern}`,
      },
    },
    condition: {
      requestDomains: [pattern],
      resourceTypes: ["main_frame"],
    },
  }));
