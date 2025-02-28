import { useTranslation } from "react-i18next";
import { Switch } from "@repo/ui/components/ui/switch";
import { useDockStore } from "../../../../stores/dock.store";
import { Icons } from "../../../../components/icons/icons";
import { cn } from "@repo/ui/lib/utils";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { ClockDock } from "../../dock/components/clock.dock";
import { CalendarDock } from "../../dock/components/calendar.dock";

interface DockItemConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isVisible: boolean;
}

export const DockSettings = () => {
  const { t } = useTranslation();
  const { dockIconsVisible, setDockIconVisible } = useDockStore();
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
        icon: ClockDock,
        isVisible: dockIconsVisible.clock,
      },
      {
        id: "calendar",
        name: t("common.calendar"),
        description: t("settings.dock.calendar.description", "Calendar view"),
        icon: CalendarDock,
        isVisible: dockIconsVisible.calendar,
      },
    ]);
  }, [t, dockIconsVisible]);

  const handleToggleItem = (item: DockItemConfig, value: boolean) => {
    // Type assertion to ensure the id is a valid key
    setDockIconVisible(item.id as keyof typeof dockIconsVisible, value);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {t("settings.dock.description")}
        </p>
      </div>

      <div className="space-y-4">
        {dockItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center space-x-4">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  "bg-gradient-to-b from-zinc-800 to-zinc-900",
                  !item.isVisible && "opacity-50"
                )}
              >
                <item.icon className="size-6 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
            <Switch
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
