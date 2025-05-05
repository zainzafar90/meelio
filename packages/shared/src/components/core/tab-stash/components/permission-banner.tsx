import { useTranslation } from "react-i18next";
import { Button } from "@repo/ui/components/ui/button";
import { Icons } from "../../../icons/icons";
import { useTabStashStore } from "../../../../stores/tab-stash.store";
import { useShallow } from "zustand/shallow";

export const PermissionBanner = () => {
  const { t } = useTranslation();
  const { requestPermissions, hasPermissions } = useTabStashStore(
    useShallow((state) => ({
      requestPermissions: state.requestPermissions,
      hasPermissions: state.hasPermissions,
    }))
  );

  if (hasPermissions) return null;

  return (
    <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        <Icons.warning className="size-5 text-yellow-500" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-200">
            {t("tab-stash.permissions-needed")}
          </h3>
          <p className="text-sm text-yellow-400/80 mt-1">
            {t("tab-stash.permissions-description")}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="text-yellow-200 border-yellow-700 hover:bg-yellow-900/20"
          onClick={() => requestPermissions()}
        >
          {t("tab-stash.grant-permission")}
        </Button>
      </div>
    </div>
  );
};
