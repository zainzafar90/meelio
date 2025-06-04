import { useTranslation } from "react-i18next";
import { Switch } from "@repo/ui/components/ui/switch";
import { Button } from "@repo/ui/components/ui/button";
import { useAppStore } from "../../../../stores/app.store";
import { useOnboardingStore } from "../../../../stores/onboarding.store";
import { useAuthStore } from "../../../../stores/auth.store";
import { useShallow } from "zustand/shallow";
import { toast } from "sonner";
import { useState } from "react";

export function GeneralSettings({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [isResetting, setIsResetting] = useState(false);

  const {
    mantraRotationEnabled,
    setMantraRotation,
    wallpaperRotationEnabled,
    setWallpaperRotationEnabled,
  } = useAppStore(
    useShallow((state) => ({
      mantraRotationEnabled: state.mantraRotationEnabled,
      setMantraRotation: state.setMantraRotation,
      wallpaperRotationEnabled: state.wallpaperRotationEnabled,
      setWallpaperRotationEnabled: state.setWallpaperRotationEnabled,
    }))
  );

  const { triggerOnboardingUpdate } = useOnboardingStore(
    useShallow((state) => ({
      triggerOnboardingUpdate: state.triggerOnboardingUpdate,
    }))
  );

  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    try {
      onClose();
      await triggerOnboardingUpdate(false);
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

      {(user || user?.settings) && (
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
      )}
    </div>
  );
}
