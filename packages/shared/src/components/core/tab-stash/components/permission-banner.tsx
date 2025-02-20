import { useTranslation } from "react-i18next";
import { Button } from "@repo/ui/components/ui/button";
import { Icons } from "../../../icons/icons";
import { useTabStashStore } from "../store/tab-stash.store";

export const PermissionBanner = () => {
  const { t } = useTranslation();
  const { requestPermissions, hasPermissions } = useTabStashStore();

  if (hasPermissions) return null;

  return (
    <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        <Icons.warning className="size-5 text-yellow-500" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-200">
            {t(
              "tab-stash.permissions-needed",
              "Additional permissions required"
            )}
          </h3>
          <p className="text-sm text-yellow-400/80 mt-1">
            {t(
              "tab-stash.permissions-description",
              "We need permission to manage your tabs to use this feature"
            )}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="text-yellow-200 border-yellow-700 hover:bg-yellow-900/20"
          onClick={() => requestPermissions()}
        >
          {t("common.grant-permission", "Grant Permission")}
        </Button>
      </div>
    </div>
  );
};
