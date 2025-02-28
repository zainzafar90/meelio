import { useTranslation } from "react-i18next";
import { Button } from "@repo/ui/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { TabSession } from "../../../../types/tab-stash.types";
import { useTabStashStore } from "../../../../stores/tab-stash.store";
import { groupTabsByWindow } from "../utils/tab-stash.utils";

interface SessionViewProps {
  session: TabSession;
  onBack: () => void;
}

export const SessionView = ({ session, onBack }: SessionViewProps) => {
  const { t } = useTranslation();
  const { restoreSession, removeSession } = useTabStashStore();

  const handleDelete = () => {
    removeSession(session.id);
    onBack();
  };

  const tabsByWindow = groupTabsByWindow(session.tabs);

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
