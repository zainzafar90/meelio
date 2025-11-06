import { Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";

import { useDockStore } from "../../../stores/dock.store";
import { Icons } from "../../icons/icons";
import { PremiumFeature } from "../../common/premium-feature";

interface App {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  isPro?: boolean;
}

interface PinnedAppsGridProps {
  searchQuery: string;
  onAppClick: () => void;
}

const buildAppsList = (
  dockIconsVisible: {
    timer?: boolean;
    soundscapes?: boolean;
    breathing?: boolean;
    tasks?: boolean;
    notes?: boolean;
    siteBlocker?: boolean;
    tabStash?: boolean;
    bookmarks?: boolean;
    weather?: boolean;
    backgrounds?: boolean;
  },
  toggleFunctions: {
    timer?: () => void;
    soundscapes?: () => void;
    breathing?: () => void;
    tasks?: () => void;
    notes?: () => void;
    siteBlocker?: () => void;
    tabStash?: () => void;
    bookmarks?: () => void;
    weather?: () => void;
    backgrounds?: () => void;
  },
  onAppClick: () => void,
  t: (key: string, options?: { defaultValue?: string }) => string
): App[] => {
  const apps: App[] = [];

  if (dockIconsVisible.timer) {
    apps.push({
      id: "timer",
      name: t("common.pomodoro"),
      icon: Icons.pomodoro,
      onClick: () => {
        toggleFunctions.timer?.();
        onAppClick();
      },
    });
  }

  if (dockIconsVisible.soundscapes) {
    apps.push({
      id: "soundscapes",
      name: t("common.soundscapes"),
      icon: Icons.soundscapes,
      onClick: () => {
        toggleFunctions.soundscapes?.();
        onAppClick();
      },
    });
  }

  if (dockIconsVisible.breathing) {
    apps.push({
      id: "breathepod",
      name: t("common.breathing"),
      icon: Icons.breathing,
      onClick: () => {
        toggleFunctions.breathing?.();
        onAppClick();
      },
    });
  }

  if (dockIconsVisible.tasks) {
    apps.push({
      id: "tasks",
      name: t("common.tasks"),
      icon: Icons.taskList,
      onClick: () => {
        toggleFunctions.tasks?.();
        onAppClick();
      },
    });
  }

  if (dockIconsVisible.notes ?? true) {
    apps.push({
      id: "notes",
      name: t("common.notes", { defaultValue: "Notes" }),
      icon: Icons.note,
      onClick: () => {
        toggleFunctions.notes?.();
        onAppClick();
      },
      isPro: true,
    });
  }

  if (dockIconsVisible.siteBlocker) {
    apps.push({
      id: "site-blocker",
      name: t("common.site-blocker"),
      icon: Icons.siteBlocker,
      onClick: () => {
        toggleFunctions.siteBlocker?.();
        onAppClick();
      },
      isPro: true,
    });
  }

  if (dockIconsVisible.tabStash) {
    apps.push({
      id: "tab-stash",
      name: t("common.tab-stash"),
      icon: Icons.tabStash,
      onClick: () => {
        toggleFunctions.tabStash?.();
        onAppClick();
      },
      isPro: true,
    });
  }

  if (dockIconsVisible.bookmarks) {
    apps.push({
      id: "bookmarks",
      name: t("common.bookmarks", { defaultValue: "Bookmarks" }),
      icon: Icons.bookmark,
      onClick: () => {
        toggleFunctions.bookmarks?.();
        onAppClick();
      },
    });
  }

  if (dockIconsVisible.weather) {
    apps.push({
      id: "weather",
      name: t("common.weather", { defaultValue: "Weather" }),
      icon: Icons.weather,
      onClick: () => {
        toggleFunctions.weather?.();
        onAppClick();
      },
      isPro: true,
    });
  }

  if (dockIconsVisible.backgrounds) {
    apps.push({
      id: "background",
      name: t("common.background"),
      icon: Icons.background,
      onClick: () => {
        toggleFunctions.backgrounds?.();
        onAppClick();
      },
    });
  }

  return apps;
};

export const PinnedAppsGrid = ({
  searchQuery,
  onAppClick,
}: PinnedAppsGridProps) => {
  const { t } = useTranslation();

  const {
    toggleTimer,
    toggleSoundscapes,
    toggleBreathing,
    toggleTasks,
    toggleNotes,
    toggleSiteBlocker,
    toggleBackgrounds,
    toggleTabStash,
    toggleBookmarks,
    toggleWeather,
    dockIconsVisible,
  } = useDockStore(
    useShallow((state) => ({
      toggleTimer: state.toggleTimer,
      toggleSoundscapes: state.toggleSoundscapes,
      toggleBreathing: state.toggleBreathing,
      toggleTasks: state.toggleTasks,
      toggleNotes: state.toggleNotes,
      toggleSiteBlocker: state.toggleSiteBlocker,
      toggleBackgrounds: state.toggleBackgrounds,
      toggleTabStash: state.toggleTabStash,
      toggleBookmarks: state.toggleBookmarks,
      toggleWeather: state.toggleWeather,
      dockIconsVisible: state.dockIconsVisible,
    }))
  );

  const apps = buildAppsList(
    dockIconsVisible,
    {
      timer: toggleTimer,
      soundscapes: toggleSoundscapes,
      breathing: toggleBreathing,
      tasks: toggleTasks,
      notes: toggleNotes,
      siteBlocker: toggleSiteBlocker,
      tabStash: toggleTabStash,
      bookmarks: toggleBookmarks,
      weather: toggleWeather,
      backgrounds: toggleBackgrounds,
    },
    onAppClick,
    t
  );

  const filteredApps = apps.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-0 pb-8">
      {filteredApps.length === 0 && (
        <div className="col-span-full text-center text-muted-foreground text-sm">
          No apps found. Try a different search.
        </div>
      )}
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 md:gap-6">
        {filteredApps.slice(0, 18).map((app) => (
          <div key={app.id} className="flex flex-col items-center">
            {app.isPro ? (
              <PremiumFeature requirePro={true}>
                <button
                  onClick={app.onClick}
                  className="group flex flex-col items-center gap-2"
                >
                  <div className="relative">
                    <div className="flex size-10 items-center justify-center rounded-xl border bg-muted/50 shadow-lg backdrop-blur-md transition-all group-hover:scale-105 group-hover:border-accent group-hover:bg-muted sm:size-16">
                      <app.icon className="size-7 text-card-foreground" />
                    </div>
                    <Crown className="absolute -right-1 -top-1 size-3.5 text-amber-400 drop-shadow-lg sm:size-4" />
                  </div>
                  <span className="line-clamp-2 text-center text-[10px] leading-tight text-card-foreground sm:text-[11px]">
                    {app.name}
                  </span>
                </button>
              </PremiumFeature>
            ) : (
              <button
                onClick={app.onClick}
                className="group flex flex-col items-center gap-2"
              >
                <div className="flex size-10 items-center justify-center rounded-xl border bg-muted/50 shadow-lg backdrop-blur-md transition-all group-hover:scale-105 group-hover:border-accent group-hover:bg-muted sm:size-16">
                  <app.icon className="size-7 text-card-foreground" />
                </div>
                <span className="line-clamp-2 text-center text-[10px] leading-tight text-card-foreground sm:text-[11px]">
                  {app.name}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
