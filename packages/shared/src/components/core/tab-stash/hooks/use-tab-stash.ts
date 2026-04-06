import { useMemo, useState } from "react";
import { useTabStashStore } from "../../../../stores/tab-stash.store";
import { useShallow } from "zustand/shallow";
import { useTranslation } from "react-i18next";
import { createTabStashService } from "../services/tab-stash.service";

export const useTabStash = () => {
  const { t } = useTranslation();
  const [isStashing, setIsStashing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addSession, checkPermissions } = useTabStashStore(
    useShallow((state) => ({
      addSession: state.addSession,
      checkPermissions: state.checkPermissions,
    }))
  );
  const service = useMemo(
    () =>
      createTabStashService({
        chromeApi:
          typeof chrome === "undefined"
            ? {}
            : {
                tabs: chrome.tabs,
                windows: chrome.windows,
                tabGroups: chrome.tabGroups,
              },
        addSession,
        checkPermissions,
        requestPermissions: async () => {
          if (typeof chrome === "undefined" || !chrome?.permissions) {
            return false;
          }

          return chrome.permissions.request({
            permissions: ["tabs", "tabGroups"],
          });
        },
        createId: crypto.randomUUID,
        now: () => new Date(),
      }),
    [addSession, checkPermissions]
  );

  const stashTabs = async (scope: "all" | "current") => {
    setIsStashing(true);
    setError(null);

    try {
      const result = await service.stashTabs(scope);

      if (!result.ok) {
        switch (result.code) {
          case "no-other-windows":
            setError(
              t(
                "tab-stash.no-other-windows",
                "No other windows to stash. Open additional windows first."
              )
            );
            break;
          case "no-tabs":
            setError(t("tab-stash.no-tabs", "No tabs to stash."));
            break;
          case "unavailable":
            setError(
              t(
                "tab-stash.extension-only",
                "Tab stash functionality is only available in the browser extension."
              )
            );
            break;
          default:
            setError(
              t(
                "tab-stash.stash-failed",
                "Failed to stash tabs. Please try again."
              )
            );
            break;
        }
      }
    } catch (error) {
      console.error("Tab stashing failed:", error);
      setError(
        t("tab-stash.stash-failed", "Failed to stash tabs. Please try again.")
      );
    } finally {
      setIsStashing(false);
    }
  };

  const ensurePermissions = async (): Promise<boolean> => {
    return service.ensurePermissions();
  };

  return {
    isStashing,
    error,
    stashTabs,
    ensurePermissions,
    clearError: () => setError(null),
  };
};
