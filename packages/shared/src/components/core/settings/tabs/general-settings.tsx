import { useTranslation } from "react-i18next";
import { Switch } from "@repo/ui/components/ui/switch";
import { cn } from "../../../../lib";
import { useAppStore } from "../../../../stores/app.store";
import { useShallow } from "zustand/shallow";
import { useBackgroundStore } from "../../../../stores/background.store";

export function GeneralSettings() {
  const { t } = useTranslation();
  const {
    mantraRotationEnabled,
    setMantraRotation,
    wallpaperRotationEnabled,
    setWallpaperRotationEnabled,
    twelveHourClock,
    setTwelveHourClock,
  } = useAppStore(
    useShallow((state) => ({
      mantraRotationEnabled: state.mantraRotationEnabled,
      setMantraRotation: state.setMantraRotation,
      wallpaperRotationEnabled: state.wallpaperRotationEnabled,
      setWallpaperRotationEnabled: state.setWallpaperRotationEnabled,
      twelveHourClock: state.twelveHourClock,
      setTwelveHourClock: state.setTwelveHourClock,
    }))
  );

  return (
    <div className="space-y-6">
      <div
        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
        onClick={() => setMantraRotation(!mantraRotationEnabled)}
      >
        <div className="flex items-center space-x-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t("settings.general.mantraRotation.description")}
            </p>
          </div>
        </div>
        <Switch
          size="sm"
          checked={mantraRotationEnabled}
          onCheckedChange={(value) => setMantraRotation(value)}
          aria-label={`${t("common.actions.toggle")} ${t("settings.general.mantraRotation.title")}`}
        />
      </div>
      <div
        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
        onClick={() => setWallpaperRotationEnabled(!wallpaperRotationEnabled)}
      >
        <div className="flex items-center space-x-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t("settings.general.wallpaperRotation.description")}
            </p>
          </div>
        </div>
        <Switch
          size="sm"
          checked={wallpaperRotationEnabled}
          onCheckedChange={(value) => setWallpaperRotationEnabled(value)}
          aria-label={`${t("common.actions.toggle")} ${t("settings.general.wallpaperRotation.title")}`}
        />
      </div>
      <div
        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
        onClick={() => setTwelveHourClock(!twelveHourClock)}
      >
        <div className="flex items-center space-x-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t("settings.general.twelveHourClock.description")}
            </p>
          </div>
        </div>
        <Switch
          size="sm"
          checked={!twelveHourClock}
          onCheckedChange={(value) => setTwelveHourClock(!value)}
          aria-label={`${t("common.actions.toggle")} ${t("settings.general.twelveHourClock.title")}`}
        />
      </div>
    </div>
  );
}
