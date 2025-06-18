import { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";

import { requestCalendarToken } from "../../api/google-calendar.api";
import { saveCalendarToken } from "../../api/calendar-tokens.api";
import { useDockStore } from "../../stores/dock.store";
import { useCalendarTokenStore } from "../../stores/calendar-token.store";
import { env } from "../../utils/env.wrapper";

/**
 * Connect Google Calendar and persist token
 */
export const CalendarSheet = () => {
  const { t } = useTranslation();
  const { isCalendarVisible, setCalendarVisible } = useDockStore(
    useShallow((state) => ({
      isCalendarVisible: state.isCalendarVisible,
      setCalendarVisible: state.setCalendarVisible,
    })),
  );
  const { setToken } = useCalendarTokenStore((state) => ({
    setToken: state.setToken,
  }));
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { token, expiresIn } = await requestCalendarToken(
        env.googleClientId,
      );
      await saveCalendarToken(token);
      setToken(token, Date.now() + expiresIn * 1000);
      setCalendarVisible(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isCalendarVisible} onOpenChange={setCalendarVisible}>
      <SheetContent
        side="right"
        className="flex flex-col gap-4 p-6 sm:max-w-sm"
      >
        <SheetHeader>
          <SheetTitle>{t("calendar.sheet.title")}</SheetTitle>
        </SheetHeader>
        <Button onClick={handleConnect} disabled={loading}>
          {loading ? t("common.loading") : t("calendar.sheet.connect")}
        </Button>
      </SheetContent>
    </Sheet>
  );
};
