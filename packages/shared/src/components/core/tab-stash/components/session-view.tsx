import { useTranslation } from "react-i18next";
import { Button } from "@repo/ui/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { TabSession, TabInfo, TabGroupColor } from "../../../../types/tab-stash.types";
import { useTabStashStore } from "../../../../stores/tab-stash.store";
import { groupTabsByWindowAndGroup } from "../utils/tab-stash.utils";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";

interface SessionViewProps {
  session: TabSession;
  onBack: () => void;
}

const getGroupColorHex = (color?: TabGroupColor): string => {
  const colorMap: Record<TabGroupColor, string> = {
    grey: "#9AA0A6",
    blue: "#4285F4",
    red: "#EA4335",
    yellow: "#FBBC04",
    green: "#34A853",
    pink: "#FF6D9E",
    purple: "#AF5CF7",
    cyan: "#00ACC1",
    orange: "#FF9800",
  };
  return colorMap[color || "grey"] || colorMap.grey;
};

const TabItem = ({ tab }: { tab: TabInfo }) => (
  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
    {tab.favicon ? (
      <img src={tab.favicon} alt="" className="size-5 shrink-0 rounded-sm" />
    ) : (
      <div className="size-5 shrink-0 rounded-sm bg-white/10" />
    )}
    <span className="truncate text-sm text-white/80">{tab.title}</span>
  </div>
);

export const SessionView = ({ session, onBack }: SessionViewProps) => {
  const { t } = useTranslation();
  const { restoreSession, removeSession } = useTabStashStore(
    useShallow((state) => ({
      restoreSession: state.restoreSession,
      removeSession: state.removeSession,
    }))
  );

  const handleDelete = () => {
    removeSession(session.id);
    onBack();
  };

  const tabsByWindowAndGroup = groupTabsByWindowAndGroup(session.tabs);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-4 border-b border-white/10 px-6 py-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="text-lg font-semibold text-white">{session.name}</h2>
      </div>

      <div className="flex gap-2 border-b border-white/10 p-6">
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

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {Object.entries(tabsByWindowAndGroup).map(([windowId, { ungrouped, grouped }]) => (
            <div key={windowId}>
              <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-white/60">
                {t("tab-stash.window", "WINDOW")}
              </h3>

              {ungrouped.length > 0 && (
                <div className="mb-4 space-y-2">
                  {ungrouped.map((tab) => (
                    <TabItem key={`${tab.windowId}-${tab.url}`} tab={tab} />
                  ))}
                </div>
              )}

              {Object.entries(grouped).map(([groupId, tabs]) => {
                const groupData = tabs[0]?.groupData;
                return (
                  <div
                    key={groupId}
                    className="mb-4 rounded-lg border"
                    style={{
                      borderColor: getGroupColorHex(groupData?.color),
                      borderLeftWidth: "4px",
                    }}
                  >
                    <div className="bg-white/5 p-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: getGroupColorHex(groupData?.color) }}
                        />
                        <span className="text-sm font-medium text-white/90">
                          {groupData?.title || t("tab-stash.unnamed-group", "Unnamed Group")}
                        </span>
                        <span className="text-xs text-white/60">
                          ({tabs.length} {t("tab-stash.tabs", "tabs")})
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 p-2">
                      {tabs.map((tab) => (
                        <TabItem key={`${tab.windowId}-${tab.groupId}-${tab.url}`} tab={tab} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
