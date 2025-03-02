import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Icons } from "../../../icons/icons";
import { useTabStashStore } from "../../../../stores/tab-stash.store";
import { TabSession } from "../../../../types/tab-stash.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface SessionListProps {
  sessions: TabSession[];
  onSelectSession: (session: TabSession) => void;
}

export const SessionList = ({
  sessions,
  onSelectSession,
}: SessionListProps) => {
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

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center text-white/60">
        <Icons.tabStash className="size-12 opacity-50" />
        <p>{t("tab-stash.no-sessions", "No stashed sessions yet")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
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
      </div>

      <div className="border-t border-white/10 p-4">
        <Button
          variant="ghost"
          className="w-full text-red-500"
          onClick={clearAllSessions}
        >
          {t("tab-stash.clear-all", "Clear All Sessions")}
        </Button>
      </div>
    </div>
  );
};
