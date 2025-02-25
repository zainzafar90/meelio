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

interface DockItemConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
}

export const DockSettings = () => {
  const { t } = useTranslation();
  const {
    isTimerIconVisible,
    isSoundscapesIconVisible,
    isBreathingIconVisible,
    isTodosIconVisible,
    isSiteBlockerIconVisible,
    isTabStashIconVisible,
    isBackgroundsIconVisible,
    setTimerIconVisible,
    setSoundscapesIconVisible,
    setBreathingIconVisible,
    setTodosIconVisible,
    setSiteBlockerIconVisible,
    setTabStashIconVisible,
    setBackgroundsIconVisible,
  } = useDockStore();

  const [dockItems, setDockItems] = useState<DockItemConfig[]>([]);

  useEffect(() => {
    setDockItems([
      {
        id: "timer",
        name: t("common.pomodoro"),
        description: t("settings.dock.timer.description"),
        icon: Icons.worldClock,
        isVisible: isTimerIconVisible,
        setVisible: setTimerIconVisible,
      },
      {
        id: "soundscapes",
        name: t("common.soundscapes"),
        description: t("settings.dock.soundscapes.description"),
        icon: Icons.soundscapes,
        isVisible: isSoundscapesIconVisible,
        setVisible: setSoundscapesIconVisible,
      },
      {
        id: "breathing",
        name: t("common.breathing"),
        description: t("settings.dock.breathing.description"),
        icon: Icons.breathing,
        isVisible: isBreathingIconVisible,
        setVisible: setBreathingIconVisible,
      },
      {
        id: "todos",
        name: t("common.todo"),
        description: t("settings.dock.todos.description"),
        icon: Icons.todoList,
        isVisible: isTodosIconVisible,
        setVisible: setTodosIconVisible,
      },
      {
        id: "site-blocker",
        name: t("common.site-blocker"),
        description: t("settings.dock.site-blocker.description"),
        icon: Icons.siteBlocker,
        isVisible: isSiteBlockerIconVisible,
        setVisible: setSiteBlockerIconVisible,
      },
      {
        id: "tab-stash",
        name: t("common.tab-stash"),
        description: t("settings.dock.tab-stash.description"),
        icon: Icons.tabStash,
        isVisible: isTabStashIconVisible,
        setVisible: setTabStashIconVisible,
      },
      {
        id: "background",
        name: t("common.background"),
        description: t("settings.dock.background.description"),
        icon: Icons.background,
        isVisible: isBackgroundsIconVisible,
        setVisible: setBackgroundsIconVisible,
      },
    ]);
  }, [
    t,
    isTimerIconVisible,
    isSoundscapesIconVisible,
    isBreathingIconVisible,
    isTodosIconVisible,
    isSiteBlockerIconVisible,
    isTabStashIconVisible,
    isBackgroundsIconVisible,
    setTimerIconVisible,
    setSoundscapesIconVisible,
    setBreathingIconVisible,
    setTodosIconVisible,
    setSiteBlockerIconVisible,
    setTabStashIconVisible,
    setBackgroundsIconVisible,
  ]);

  const handleToggleItem = (item: DockItemConfig, value: boolean) => {
    item.setVisible(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("settings.dock.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("settings.dock.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.dock.visibility.title")}</CardTitle>
          <CardDescription>
            {t("settings.dock.visibility.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    <p className="text-sm font-medium leading-none">
                      {item.name}
                    </p>
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
        </CardContent>
      </Card>
    </div>
  );
};
