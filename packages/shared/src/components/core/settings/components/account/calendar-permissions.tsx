import { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { useTranslation } from "react-i18next";
import { Icons } from "../../../../icons/icons";
import { useCalendarStore } from "../../../../../stores/calendar.store";

export const CalendarPermissions = () => {
  const { t } = useTranslation();
  const { permission, revokeAccess } = useCalendarStore((state) => ({
    permission: state.permission,
    revokeAccess: state.revokeAccess,
  }));
  const [loading, setLoading] = useState(false);

  if (!permission) return null;

  const handleRevoke = async () => {
    setLoading(true);
    try {
      await revokeAccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <Button variant="destructive" onClick={handleRevoke} disabled={loading}>
        {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
        {t("settings.account.revokeCalendar")}
      </Button>
    </div>
  );
};
