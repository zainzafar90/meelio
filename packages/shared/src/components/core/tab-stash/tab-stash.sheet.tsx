import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { useDockStore } from "../../../stores/dock.store";
import { useTabStashStore } from "../../../stores/tab-stash.store";
import { useTabStash } from "./hooks/use-tab-stash";
import { TabSession } from "../../../types/tab-stash.types";
import { PermissionBanner } from "./components/permission-banner";
import { SessionList } from "./components/session-list";
import { SessionView } from "./components/session-view";
import { VisuallyHidden } from "@repo/ui/components/ui/visually-hidden";
import { useShallow } from "zustand/shallow";
import { PremiumFeature } from "../../../components/common/premium-feature";
import { Icons } from "../../../components/icons";
import { useAuthStore } from "../../../stores/auth.store";
import { hasReachedDailyStashLimit } from "./hooks/use-tab-stash";

const isExtension = typeof chrome !== "undefined" && !!chrome.storage;

export function TabStashSheet() {
  const { t } = useTranslation();
  const { isTabStashVisible, toggleTabStash } = useDockStore(
    useShallow((state) => ({
      isTabStashVisible: state.isTabStashVisible,
      toggleTabStash: state.toggleTabStash,
    }))
  );
  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );
  const requirePro = !user?.isPro && hasReachedDailyStashLimit();

  return (
    <Sheet open={isTabStashVisible} onOpenChange={toggleTabStash}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl border-l border-white/10 bg-zinc-900 backdrop-blur-xl"
      >
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle>{t("tab-stash.title")}</SheetTitle>
            <SheetDescription>{t("tab-stash.description")}</SheetDescription>
          </SheetHeader>
        </VisuallyHidden>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {t("tab-stash.title")}
          </h2>
        </div>

        {isExtension ? (
          <PremiumFeature
            requirePro={requirePro}
            fallback={
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 border border-white/10">
                    <Icons.proMember className="w-8 h-8 text-white/80" />
                  </div>
                  <div className="text-lg text-white font-medium mb-2">
                    {t("tab-stash.premium-feature-title", "Premium Tab Stash")}
                  </div>
                  <div className="text-white/70 max-w-md mb-6">
                    {t("tab-stash.premium-feature")}
                  </div>
                </div>
                <Button
                  variant="default"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  onClick={() => console.log("/settings/billing")}
                >
                  {t("tab-stash.upgrade", "Upgrade to Pro")}
                </Button>
              </div>
            }
          >
            <ExtensionTabStashContent />
          </PremiumFeature>
        ) : (
          <BrowserTabStashContent />
        )}
      </SheetContent>
    </Sheet>
  );
}

const ExtensionTabStashContent = () => {
  const { t } = useTranslation();
  const [selectedSession, setSelectedSession] = useState<TabSession | null>(
    null
  );
  const { sessions, hasPermissions, checkPermissions } = useTabStashStore(
    useShallow((state) => ({
      sessions: state.sessions,
      hasPermissions: state.hasPermissions,
      checkPermissions: state.checkPermissions,
    }))
  );
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
            {t("tab-stash.stash-all")}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => stashTabs("current")}
            disabled={!hasPermissions || isStashing}
          >
            {t("tab-stash.stash-current")}
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
                {t("common.actions.dismiss")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {hasPermissions ? (
        <SessionList sessions={sessions} onSelectSession={setSelectedSession} />
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-white/60">
          {t("tab-stash.needs-permission")}
        </div>
      )}
    </div>
  );
};

const BrowserTabStashContent = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-lg text-white">{t("tab-stash.extension-only")}</div>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() =>
          window.open(
            "https://chromewebstore.google.com/detail/meelio/cjcgnlglboofgepielbmjcepcdohipaj",
            "_blank",
            "noopener,noreferrer"
          )
        }
      >
        {t("tab-stash.get-extension")}
      </Button>
    </div>
  );
};
