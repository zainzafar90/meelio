import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent } from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { useDockStore } from "../../../stores/dock.store";
import { useTabStashStore } from "./store/tab-stash.store";
import { useTabStash } from "./hooks/use-tab-stash";
import { TabSession } from "../../../types/tab-stash.types";
import { PermissionBanner } from "./components/permission-banner";
import { SessionList } from "./components/session-list";
import { SessionView } from "./components/session-view";

const isExtension = typeof chrome !== "undefined" && !!chrome.storage;

export const TabStashSheet = () => {
  const { t } = useTranslation();
  const { isTabStashVisible, toggleTabStash } = useDockStore((state) => ({
    isTabStashVisible: state.isTabStashVisible,
    toggleTabStash: state.toggleTabStash,
  }));

  return (
    <Sheet open={isTabStashVisible} onOpenChange={toggleTabStash}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl border-l border-white/10 bg-zinc-900 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {t("common.tab-stash", "Tab Stash")}
          </h2>
        </div>

        {isExtension ? (
          <ExtensionTabStashContent />
        ) : (
          <BrowserTabStashContent />
        )}
      </SheetContent>
    </Sheet>
  );
};

const ExtensionTabStashContent = () => {
  const { t } = useTranslation();
  const [selectedSession, setSelectedSession] = useState<TabSession | null>(
    null
  );
  const { sessions, hasPermissions, checkPermissions } = useTabStashStore();
  const { isStashing, error, stashTabs, clearError } = useTabStash();

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  useEffect(() => {
    if (hasPermissions) {
      useTabStashStore.getState().loadSessions();
    }
  }, [hasPermissions]);

  if (selectedSession) {
    return (
      <SessionView
        session={selectedSession}
        onBack={() => setSelectedSession(null)}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-white/10 p-4">
        <PermissionBanner />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => stashTabs("all")}
            disabled={!hasPermissions || isStashing}
          >
            {t("tab-stash.stash-all", "Stash All Windows")}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => stashTabs("current")}
            disabled={!hasPermissions || isStashing}
          >
            {t("tab-stash.stash-current", "Stash Current Window")}
          </Button>
        </div>
        {error && (
          <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-yellow-200">{error}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-yellow-200 hover:bg-yellow-900/20"
                onClick={clearError}
              >
                {t("common.dismiss", "Dismiss")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {hasPermissions ? (
        <SessionList sessions={sessions} onSelectSession={setSelectedSession} />
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-white/60">
          {t(
            "tab-stash.needs-permission",
            "Grant permissions to view stashed sessions"
          )}
        </div>
      )}
    </div>
  );
};

const BrowserTabStashContent = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-lg text-white">
        {t(
          "tab-stash.extension-only",
          "Tab stash functionality is only available in the browser extension."
        )}
      </div>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() =>
          window.open(
            "https://chrome.google.com/webstore/detail/your-extension-id",
            "_blank",
            "noopener,noreferrer"
          )
        }
      >
        {t("tab-stash.get-extension", "Get the Extension")}
      </Button>
    </div>
  );
};
