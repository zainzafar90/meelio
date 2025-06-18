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
import { useDockStore } from "../../../stores/dock.store";
import { useCalendarStore } from "../../../stores/calendar.store";
import { getCalendarAuthUrl, deleteCalendarToken } from "../../../api/calendar.api";

/**
 * Connect Google Calendar and persist token
 */
export const CalendarSheet = () => {
  const { t } = useTranslation();
  const { isCalendarVisible, setCalendarVisible } = useDockStore(
    useShallow((state) => ({
      isCalendarVisible: state.isCalendarVisible,
      setCalendarVisible: state.setCalendarVisible,
    }))
  );
  const { token, nextEvent, clearCalendar } = useCalendarStore(
    useShallow((state) => ({
      token: state.token,
      nextEvent: state.nextEvent,
      clearCalendar: state.clearCalendar,
    }))
  );
  const [loading, setLoading] = useState(false);

  const isConnected = !!token;

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await getCalendarAuthUrl();
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error("Calendar authorization failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await deleteCalendarToken();
      clearCalendar();
      setCalendarVisible(false);
    } catch (error) {
      console.error("Failed to disconnect calendar:", error);
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
        
        {isConnected ? (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-green-600">
              ✓ {t("calendar.sheet.connected")}
            </div>
            {nextEvent && (
              <div className="text-sm text-gray-600">
                <strong>{t("calendar.sheet.nextEvent")}:</strong> {nextEvent.summary}
              </div>
            )}
            <Button onClick={handleDisconnect} variant="outline">
              {t("calendar.sheet.disconnect")}
            </Button>
          </div>
        ) : (
          <Button onClick={handleConnect} disabled={loading}>
            {loading ? t("common.loading") : t("calendar.sheet.connect")}
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
};
