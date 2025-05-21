import { useTranslation } from "react-i18next";
import { Switch } from "@repo/ui/components/ui/switch";
import { useDockStore } from "../../../../stores/dock.store";
import { Icons } from "../../../../components/icons/icons";
import { cn } from "@repo/ui/lib/utils";
import { useState, useEffect } from "react";
import { useShallow } from "zustand/shallow";

interface DockItemConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isVisible: boolean;
}

export const DockSettings = () => {
  const { t } = useTranslation();
  const { dockIconsVisible, setDockIconVisible } = useDockStore(
    useShallow((state) => ({
      dockIconsVisible: state.dockIconsVisible,
      setDockIconVisible: state.setDockIconVisible,
    }))
  );
  const [dockItems, setDockItems] = useState<DockItemConfig[]>([]);

  useEffect(() => {
    setDockItems([
      {
        id: "timer",
        name: t("common.pomodoro"),
        description: t("settings.dock.timer.description"),
        icon: Icons.pomodoro,
        isVisible: dockIconsVisible.timer,
      },
      {
        id: "soundscapes",
        name: t("common.soundscapes"),
        description: t("settings.dock.soundscapes.description"),
        icon: Icons.soundscapes,
        isVisible: dockIconsVisible.soundscapes,
      },
      {
        id: "breathing",
        name: t("common.breathing"),
        description: t("settings.dock.breathing.description"),
        icon: Icons.breathing,
        isVisible: dockIconsVisible.breathing,
      },
      {
        id: "todos",
        name: t("common.todo"),
        description: t("settings.dock.todos.description"),
        icon: Icons.todoList,
        isVisible: dockIconsVisible.todos,
      },
      {
        id: "siteBlocker",
        name: t("common.site-blocker"),
        description: t("settings.dock.site-blocker.description"),
        icon: Icons.siteBlocker,
        isVisible: dockIconsVisible.siteBlocker,
      },
      {
        id: "tabStash",
        name: t("common.tab-stash"),
        description: t("settings.dock.tab-stash.description"),
        icon: Icons.tabStash,
        isVisible: dockIconsVisible.tabStash,
      },
      {
        id: "backgrounds",
        name: t("common.background"),
        description: t("settings.dock.background.description"),
        icon: Icons.background,
        isVisible: dockIconsVisible.backgrounds,
      },
      {
        id: "clock",
        name: t("common.clock"),
        description: t("settings.dock.clock.description", "System clock"),
        icon: Icons.worldClock,
        isVisible: dockIconsVisible.clock,
      },
      {
        id: "calendar",
        name: t("common.calendar"),
        description: t("settings.dock.calendar.description", "Calendar view"),
        icon: Icons.moodTracker,
        isVisible: dockIconsVisible.calendar,
      },
    ]);
  }, [t, dockIconsVisible]);

  const handleToggleItem = (item: DockItemConfig, value: boolean) => {
    setDockIconVisible(item.id as keyof typeof dockIconsVisible, value);
  };

  const { showIconLabels, setShowIconLabels } = useDockStore(
    useShallow((state) => ({
      showIconLabels: state.showIconLabels,
      setShowIconLabels: state.setShowIconLabels,
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {t("settings.dock.description")}
        </p>
      </div>

      <div
        className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 p-4 transition-colors hover:bg-muted/50 cursor-pointer"
        onClick={() => setShowIconLabels(!showIconLabels)}
      >
        <div className="flex items-center space-x-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t("settings.dock.show-icon-labels.description")}
            </p>
          </div>
        </div>
        <Switch
          size="sm"
          checked={showIconLabels}
          onCheckedChange={(value) => setShowIconLabels(value)}
          aria-label={`${t("common.actions.toggle")} ${t("settings.dock.show-icon-labels.title")}`}
        />
      </div>

      <div className="overflow-hidden shadow-sm ring-1 ring-gray-100/10 rounded-xl border border-gray-200 dark:border-gray-800">
        {dockItems.map((item, index) => (
          <div
            key={item.id}
            onClick={() => handleToggleItem(item, !item.isVisible)}
            className={cn(
              "flex items-center justify-between px-6 py-5 transition-colors hover:bg-muted/50 cursor-pointer",
              index !== dockItems.length - 1 &&
                "border-b border-gray-200 dark:border-gray-800"
            )}
          >
            <div className="flex items-center space-x-4">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-lg",
                  "bg-gradient-to-b from-zinc-800 to-zinc-900",
                  !item.isVisible && "opacity-50"
                )}
              >
                <item.icon className="size-4 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
            <Switch
              size="sm"
              checked={item.isVisible}
              onCheckedChange={(value) => handleToggleItem(item, value)}
              aria-label={`${t("common.actions.toggle")} ${item.name}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
