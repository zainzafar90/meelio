import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@repo/ui/components/ui/sheet";
import { useDockStore } from "../../../stores/dock.store";
import { Button } from "@repo/ui/components/ui/button";
import { useTranslation } from "react-i18next";
import { useTabStashStore, TabSession } from "../../../stores/tab-stash.store";
import { Input } from "@repo/ui/components/ui/input";
import { Icons } from "../../icons/icons";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { MoreVertical, ChevronLeft } from "lucide-react";
import { filterValidTabs } from "../../../utils/tab-utils";

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

const SessionView = ({
  session,
  onBack,
}: {
  session: TabSession;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  const { restoreSession, removeSession } = useTabStashStore();

  const handleDelete = () => {
    removeSession(session.id);
    onBack();
  };

  // Group tabs by window
  const tabsByWindow = session.tabs.reduce(
    (acc, tab) => {
      if (!acc[tab.windowId]) {
        acc[tab.windowId] = [];
      }
      acc[tab.windowId].push(tab);
      return acc;
    },
    {} as Record<number, typeof session.tabs>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-4 border-b border-white/10 px-6 py-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="text-lg font-semibold text-white">{session.name}</h2>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 bg-zinc-700/50 hover:bg-zinc-700"
            onClick={() => restoreSession(session.id)}
          >
            {t("tab-stash.restore-session", "Restore session")}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-zinc-700 text-red-400 hover:bg-red-400/10 hover:text-red-300"
            onClick={handleDelete}
          >
            {t("tab-stash.delete-session", "Delete session")}
          </Button>
        </div>

        <div className="space-y-6">
          {Object.entries(tabsByWindow).map(([windowId, tabs], index) => (
            <div key={windowId}>
              <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-white/60">
                {t("tab-stash.window", "WINDOW")}
              </h3>
              <div className="space-y-2">
                {tabs.map((tab, tabIndex) => (
                  <div
                    key={tabIndex}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    {tab.favicon ? (
                      <img
                        src={tab.favicon}
                        alt=""
                        className="size-5 shrink-0 rounded-sm"
                      />
                    ) : (
                      <div className="size-5 shrink-0 rounded-sm bg-white/10" />
                    )}
                    <span className="truncate text-sm text-white/80">
                      {tab.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SessionsList = ({
  sessions,
  onSelectSession,
}: {
  sessions: TabSession[];
  onSelectSession: (session: TabSession) => void;
}) => {
  const { t } = useTranslation();
  const [sessionNameInput, setSessionNameInput] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const { renameSession, removeSession, clearAllSessions } = useTabStashStore();

  const handleRenameSession = (sessionId: string) => {
    if (sessionNameInput.trim()) {
      renameSession(sessionId, sessionNameInput.trim());
      setSessionNameInput("");
      setEditingSessionId(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 p-6 text-center text-white/60">
            <Icons.tabStash className="size-12 opacity-50" />
            <p>{t("tab-stash.no-sessions", "No stashed sessions yet")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-lg border border-white/10 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  {editingSessionId === session.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={sessionNameInput}
                        onChange={(e) => setSessionNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameSession(session.id);
                          }
                        }}
                        className="flex-1"
                        placeholder={t(
                          "tab-stash.session-name",
                          "Enter session name"
                        )}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleRenameSession(session.id)}
                      >
                        {t("common.save", "Save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingSessionId(null)}
                      >
                        {t("common.cancel", "Cancel")}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        className="flex-1 justify-start px-0 text-lg font-medium text-white hover:bg-transparent"
                        onClick={() => onSelectSession(session)}
                        type="button"
                        asChild={false}
                      >
                        <span className="truncate">{session.name}</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingSessionId(session.id);
                              setSessionNameInput(session.name);
                            }}
                          >
                            {t("common.rename", "Rename")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => removeSession(session.id)}
                            className="text-red-500"
                          >
                            {t("common.delete", "Delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>

                <div className="mb-4 text-sm text-white/60">
                  {session.windowCount}{" "}
                  {session.windowCount === 1
                    ? t("tab-stash.window", "window")
                    : t("tab-stash.windows", "windows")}{" "}
                  · {session.tabs.length}{" "}
                  {session.tabs.length === 1
                    ? t("tab-stash.tab", "tab")
                    : t("tab-stash.tabs", "tabs")}
                </div>

                <div className="space-y-2">
                  {session.tabs.slice(0, 3).map((tab, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-white/80"
                    >
                      {tab.favicon ? (
                        <img
                          src={tab.favicon}
                          alt=""
                          className="size-4 rounded-sm"
                        />
                      ) : (
                        <div className="size-4 rounded-sm bg-white/10" />
                      )}
                      <span className="truncate">{tab.title}</span>
                    </div>
                  ))}
                  {session.tabs.length > 3 && (
                    <div className="text-sm text-white/60">
                      +{session.tabs.length - 3} more tabs
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {sessions.length > 0 && (
        <div className="border-t border-white/10 p-4">
          <Button
            variant="ghost"
            className="w-full text-red-500"
            onClick={clearAllSessions}
          >
            {t("tab-stash.clear-all", "Clear All Sessions")}
          </Button>
        </div>
      )}
    </div>
  );
};

const PermissionBanner = () => {
  const { t } = useTranslation();
  const { checkPermissions, requestPermissions, hasPermissions } =
    useTabStashStore();

  if (hasPermissions) return null;

  return (
    <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        <Icons.warning className="size-5 text-yellow-500" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-200">
            {t(
              "tab-stash.permissions-needed",
              "Additional permissions required"
            )}
          </h3>
          <p className="text-sm text-yellow-400/80 mt-1">
            {t(
              "tab-stash.permissions-description",
              "We need permission to manage your tabs to use this feature"
            )}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="text-yellow-200 border-yellow-700 hover:bg-yellow-900/20"
          onClick={() => requestPermissions()}
        >
          {t("common.grant-permission", "Grant Permission")}
        </Button>
      </div>
    </div>
  );
};

const ExtensionTabStashContent = () => {
  const { t } = useTranslation();
  const [isStashingAll, setIsStashingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<TabSession | null>(
    null
  );
  const {
    sessions,
    hasPermissions,
    checkPermissions,
    addSession,
    loadSessions,
    requestPermissions,
  } = useTabStashStore();

  // Load initial permissions
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Unified stash handler
  const handleStashTabs = async (scope: "all" | "current") => {
    setIsStashingAll(true);
    setError(null);

    try {
      const [currentTab, windows] = await Promise.all([
        chrome.tabs.getCurrent(),
        scope === "all"
          ? chrome.windows.getAll({ populate: true })
          : [await chrome.windows.getCurrent({ populate: true })],
      ]);

      const tabsToStash = windows.flatMap((window) =>
        filterValidTabs(window.tabs || [], currentTab?.id)
      );

      if (tabsToStash.length === 0) {
        setError(t("tab-stash.no-tabs", "No tabs available to stash"));
        return;
      }

      const newSession: TabSession = {
        id: crypto.randomUUID(),
        name: format(new Date(), "MMM d, yyyy h:mm a"),
        timestamp: Date.now(),
        tabs: tabsToStash,
        windowCount: windows.length,
      };

      await addSession(newSession);

      // Close stashed tabs using proper tab IDs
      const tabIds = tabsToStash
        .map((t) => t.id)
        .filter((id): id is number => !!id);

      if (tabIds.length > 0) {
        try {
          await chrome.tabs.remove(tabIds);
        } catch (error) {
          console.warn("Some tabs couldn't be closed:", error);
        }
      }
    } catch (error) {
      console.error("Tab stashing failed:", error);
      setError(
        t("tab-stash.stash-error", "Failed to stash tabs. Please try again.")
      );
    } finally {
      setIsStashingAll(false);
    }
  };

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
            onClick={() => handleStashTabs("all")}
            disabled={!hasPermissions || isStashingAll}
          >
            {t("tab-stash.stash-all", "Stash All Windows")}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleStashTabs("current")}
            disabled={!hasPermissions}
          >
            {t("tab-stash.stash-current", "Stash Current Window")}
          </Button>
        </div>
        {error && <div className="text-sm text-red-500">{error}</div>}
      </div>

      {hasPermissions ? (
        <SessionsList
          sessions={sessions}
          onSelectSession={setSelectedSession}
        />
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
