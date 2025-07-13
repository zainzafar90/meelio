import { useState, useEffect } from "react";
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
import {
  getCalendarAuthUrl,
  deleteCalendarToken,
} from "../../../api/calendar.api";
import { CalendarEvent } from "../../../api/google-calendar.api";
import { getCalendarColor } from "../../../utils/calendar-colors";
import { Copy, Bell, Share } from "lucide-react";
import { toast } from "sonner";

/**
 * Connect Calendar and persist token
 */
export const CalendarSheet = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { isCalendarVisible, setCalendarVisible } = useDockStore(
    useShallow((state) => ({
      isCalendarVisible: state.isCalendarVisible,
      setCalendarVisible: state.setCalendarVisible,
    }))
  );
  const { token, events, connectedEmail, clearCalendar } = useCalendarStore(
    useShallow((state) => ({
      token: state.token,
      events: state.events,
      connectedEmail: state.connectedEmail,
      clearCalendar: state.clearCalendar,
    }))
  );

  const isConnected = !!token;

  const formatTimeRemaining = (event: CalendarEvent): string => {
    const now = new Date();
    const eventStart = new Date(event.start.dateTime || event.start.date || "");
    const eventEnd = new Date(event.end.dateTime || event.end.date || "");
    
    // Check if event is currently happening
    if (now >= eventStart && now < eventEnd) {
      const endDiffMs = eventEnd.getTime() - now.getTime();
      const endMinutes = Math.floor(endDiffMs / (1000 * 60));
      
      if (endMinutes <= 0) return "Ending now";
      if (endMinutes < 60) return `${endMinutes} minutes left`;
      
      const endHours = Math.floor(endMinutes / 60);
      return `${endHours} hours left`;
    }
    
    // Event is in the future
    const startDiffMs = eventStart.getTime() - now.getTime();
    
    if (startDiffMs <= 0) return "Now";

    const minutes = Math.floor(startDiffMs / (1000 * 60));
    if (minutes < 60) return `${minutes} minutes remaining`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours remaining`;

    const days = Math.floor(hours / 24);
    return `${days} days remaining`;
  };

  const formatEventTime = (event: CalendarEvent): string => {
    const start = new Date(event.start.dateTime || event.start.date || "");
    const end = new Date(event.end.dateTime || event.end.date || "");

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString([], {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    };

    return `${formatDate(start)} • ${formatTime(start)} – ${formatTime(end)}`;
  };

  const copyMeetingLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast.success(t("calendar.sheet.meetingLinkCopied"));
  };

  const getMeetingLink = (event: CalendarEvent): string | null => {
    // Check hangoutLink first
    if (event.hangoutLink) {
      return event.hangoutLink;
    }

    // Check conferenceData
    if (event.conferenceData?.entryPoints?.length > 0) {
      const videoEntry = event.conferenceData.entryPoints.find(
        (entry) => entry.entryPointType === "video"
      );
      if (videoEntry?.uri) {
        return videoEntry.uri;
      }

      // Fallback to first entry point
      return event.conferenceData.entryPoints[0].uri;
    }

    return null;
  };

  const getUpcomingEvents = (): CalendarEvent[] => {
    const now = new Date();
    return events
      .filter((event) => {
        // Keep events visible until their end time has passed
        const eventEnd = new Date(
          event.end.dateTime || event.end.date || ""
        );
        return eventEnd > now;
      })
      .sort((a, b) => {
        const aStart = new Date(a.start.dateTime || a.start.date || "");
        const bStart = new Date(b.start.dateTime || b.start.date || "");
        return aStart.getTime() - bStart.getTime();
      })
      .slice(0, 10); // Show max 10 events
  };

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
          <SheetTitle>
            {t("calendar.sheet.title")}
            {connectedEmail && (
              <div className="text-sm font-normal text-muted-foreground mt-1">
                Connected as{" "}
                <span className="font-medium text-blue-600">
                  {connectedEmail}
                </span>
              </div>
            )}
          </SheetTitle>
        </SheetHeader>

        {isConnected ? (
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            <div className="flex items-center justify-between p-2">
              <div className="text-sm text-green-600">
                ✓ {t("calendar.sheet.connected")}
              </div>
              <Button onClick={handleDisconnect} variant="outline" size="sm">
                {t("calendar.sheet.disconnect")}
              </Button>
            </div>

            <div className="flex flex-col gap-6 flex-1 overflow-y-auto">
              {getUpcomingEvents().length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No upcoming events
                </div>
              ) : (
                getUpcomingEvents().map((event) => {
                  const eventColor = getCalendarColor(event.colorId);
                  const meetingLink = getMeetingLink(event);

                  return (
                    <div
                      key={event.id}
                      className="space-y-4 p-4 rounded-2xl bg-card border border-border/50"
                    >
                      {/* Event Title with Color and Join Button */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="size-3 rounded-md flex-shrink-0"
                            style={{ backgroundColor: eventColor }}
                          />
                          <h4 className="text-sm font-semibold text-card-foreground truncate">
                            {event.summary || "Untitled Event"}
                          </h4>
                        </div>
                        {meetingLink && (
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                            onClick={() => window.open(meetingLink, "_blank")}
                          >
                            <Share className="w-3 h-3 mr-1" />
                            Join
                          </Button>
                        )}
                      </div>

                      {/* Event Time */}
                      <p className="text-sm text-muted-foreground">
                        {formatEventTime(event)}
                      </p>

                      {/* Meeting Link */}
                      {meetingLink && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground font-mono">
                            {meetingLink.replace("https://", "")}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => copyMeetingLink(meetingLink)}
                            title="Copy meeting link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Time Reminder */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Bell className="w-4 h-4" />
                        <span>{formatTimeRemaining(event)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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
