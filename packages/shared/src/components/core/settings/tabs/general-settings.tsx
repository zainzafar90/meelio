import { useTranslation } from "react-i18next";
import { Switch } from "@repo/ui/components/ui/switch";
import { Button } from "@repo/ui/components/ui/button";
import { useAppStore } from "../../../../stores/app.store";
import { useOnboardingStore } from "../../../../stores/onboarding.store";
import { useShallow } from "zustand/shallow";
import { toast } from "sonner";
import { useState } from "react";

export function GeneralSettings({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [isResetting, setIsResetting] = useState(false);

  const {
    platform,
    mantraRotationEnabled,
    setMantraRotation,
    wallpaperRotationEnabled,
    setWallpaperRotationEnabled,
    twelveHourClock,
    setTwelveHourClock,
    confettiOnComplete,
    setConfettiOnComplete,
    zenMode,
    updateZenModeSettings,
  } = useAppStore(
    useShallow((state) => ({
      platform: state.platform,
      mantraRotationEnabled: state.mantraRotationEnabled,
      setMantraRotation: state.setMantraRotation,
      wallpaperRotationEnabled: state.wallpaperRotationEnabled,
      setWallpaperRotationEnabled: state.setWallpaperRotationEnabled,
      twelveHourClock: state.twelveHourClock,
      setTwelveHourClock: state.setTwelveHourClock,
      confettiOnComplete: state.confettiOnComplete ?? true,
      setConfettiOnComplete: state.setConfettiOnComplete,
      zenMode: state.zenMode,
      updateZenModeSettings: state.updateZenModeSettings,
    }))
  );

  const { triggerOnboardingUpdate } = useOnboardingStore(
    useShallow((state) => ({
      triggerOnboardingUpdate: state.triggerOnboardingUpdate,
    }))
  );

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    try {
      await triggerOnboardingUpdate(false);
      onClose();
    } catch (error) {
      console.error("Failed to reset onboarding:", error);
      toast.error(t("settings.general.onboardingReset.error"));
    } finally {
      setIsResetting(false);
    }
  };

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
        onClick={() => setConfettiOnComplete?.(!confettiOnComplete)}
      >
        <div className="flex items-center space-x-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {t("settings.general.confettiOnComplete.title")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("settings.general.confettiOnComplete.description")}
            </p>
          </div>
        </div>
        <Switch
          size="sm"
          checked={confettiOnComplete}
          onCheckedChange={(value) => setConfettiOnComplete?.(value)}
          aria-label={`${t("common.actions.toggle")} ${t("settings.general.confettiOnComplete.title")}`}
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

      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {t("settings.general.zenMode.title")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("settings.general.zenMode.description")}
          </p>
          {platform === "web" && (
            <p className="text-xs text-muted-foreground">
              {t("settings.general.zenMode.platformNote")}
            </p>
          )}
        </div>

        <ZenModeToggleRow
          title={t("settings.general.zenMode.timer.title")}
          description={t("settings.general.zenMode.timer.description")}
          checked={zenMode.timerEnabled}
          onCheckedChange={(value) =>
            updateZenModeSettings({ timerEnabled: value })
          }
        />
        <ZenModeToggleRow
          title={t("settings.general.zenMode.soundscapes.title")}
          description={t("settings.general.zenMode.soundscapes.description")}
          checked={zenMode.soundscapesEnabled}
          onCheckedChange={(value) =>
            updateZenModeSettings({ soundscapesEnabled: value })
          }
        />
        <ZenModeToggleRow
          title={t("settings.general.zenMode.pinnedTaskSync.title")}
          description={t("settings.general.zenMode.pinnedTaskSync.description")}
          checked={zenMode.pinnedTaskSyncEnabled}
          onCheckedChange={(value) =>
            updateZenModeSettings({ pinnedTaskSyncEnabled: value })
          }
        />
        <ZenModeToggleRow
          title={t("settings.general.zenMode.siteBlocker.title")}
          description={t("settings.general.zenMode.siteBlocker.description")}
          checked={zenMode.siteBlockerEnabled}
          onCheckedChange={(value) =>
            updateZenModeSettings({ siteBlockerEnabled: value })
          }
        />
        <ZenModeToggleRow
          title={t("settings.general.zenMode.tabStash.title")}
          description={t("settings.general.zenMode.tabStash.description")}
          checked={zenMode.tabStashEnabled}
          onCheckedChange={(value) =>
            updateZenModeSettings({ tabStashEnabled: value })
          }
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4 transition-colors">
        <div className="flex items-center space-x-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {t("settings.general.onboardingReset.title")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("settings.general.onboardingReset.description")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetOnboarding}
          disabled={isResetting}
        >
          {isResetting ? "..." : t("settings.general.onboardingReset.button")}
        </Button>
      </div>
    </div>
  );
}

const ZenModeToggleRow = ({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) => (
  <div
    className="flex items-center justify-between rounded-lg border border-white/10 p-4 transition-colors hover:bg-muted/30 cursor-pointer"
    onClick={() => onCheckedChange(!checked)}
  >
    <div className="space-y-1 pr-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch
      size="sm"
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={title}
    />
  </div>
);
