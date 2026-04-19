import { sendExtensionCommand } from "@repo/platform/extension/site-blocker";
import {
  createDefaultTabStashService,
  createZenModeRuntime,
  useTabStashStore,
} from "@repo/shared";

const getBlockerState = async () => {
  const response = await sendExtensionCommand({
    type: "blocker/get-state",
  } as const);

  if (!response || typeof response !== "object" || !("state" in response)) {
    throw new Error("Failed to read blocker state.");
  }

  return response.state;
};

export const createExtensionZenModeRuntime = () => {
  const tabStashService = createDefaultTabStashService();

  return createZenModeRuntime({
    refreshBrowserCapabilities: async () => {
      const [blockerState, hasTabPermissions] = await Promise.all([
        getBlockerState(),
        useTabStashStore.getState().checkPermissions(),
      ]);

      return {
        siteBlocker: blockerState.settings.permissionGranted
          ? "ready"
          : "permission-needed",
        tabStash: hasTabPermissions ? "ready" : "permission-needed",
      } as const;
    },
    enterSiteBlockerSession: async () => {
      const state = await getBlockerState();
      const snapshot = {
        enabled: state.settings.enabled,
        activationMode: state.settings.activationMode,
      } as const;

      if (!state.settings.enabled) {
        await sendExtensionCommand({
          type: "blocker/set-enabled",
          payload: {
            enabled: true,
          },
        });
      }

      if (state.settings.activationMode !== "focus-only") {
        await sendExtensionCommand({
          type: "blocker/set-activation-mode",
          payload: {
            activationMode: "focus-only",
          },
        });
      }

      return snapshot;
    },
    exitSiteBlockerSession: async (snapshot) => {
      await sendExtensionCommand({
        type: "blocker/set-timer-state",
        payload: {
          stage: "focus",
          isRunning: false,
        },
      });

      if (!snapshot) {
        return;
      }

      const state = await getBlockerState();

      if (state.settings.activationMode !== snapshot.activationMode) {
        await sendExtensionCommand({
          type: "blocker/set-activation-mode",
          payload: {
            activationMode: snapshot.activationMode,
          },
        });
      }

      if (state.settings.enabled !== snapshot.enabled) {
        await sendExtensionCommand({
          type: "blocker/set-enabled",
          payload: {
            enabled: snapshot.enabled,
          },
        });
      }
    },
    syncSiteBlockerFocusState: async ({ isRunning, stage }) => {
      await sendExtensionCommand({
        type: "blocker/set-timer-state",
        payload: {
          stage,
          isRunning,
        },
      });
    },
    stashTabs: async () => {
      const result = await tabStashService.stashTabs("all");
      return result.ok;
    },
  });
};
