import { useTranslation } from "react-i18next";
import { Switch } from "@repo/ui/components/ui/switch";

import { useAppStore } from "../../../../stores/app.store";

export function GeneralSettings() {
  const { t } = useTranslation();
  const { mantraRotationEnabled, setMantraRotation } = useAppStore();

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
    </div>
  );
}
