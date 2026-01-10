import { useState, useEffect } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/components/ui/collapsible";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";
import { useDockStore } from "../../../stores/dock.store";
import { useCalendarStore } from "../../../stores/calendar.store";
import type { CalendarEvent } from "../../../types/calendar.types";
import { getCalendarColor } from "../../../utils/calendar-colors";
import {
  getEventStartDate,
  getEventEndDate,
  isEventHappening,
  isAllDayEvent,
  isEventToday,
} from "../../../utils/calendar-date.utils";
import { Copy, Bell, Share, ChevronDown, Calendar, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const CalendarSheet = () => {
  const { t } = useTranslation();
  const [urlInput, setUrlInput] = useState("");
  const { isCalendarVisible, setCalendarVisible } = useDockStore(
    useShallow((state) => ({
      isCalendarVisible: state.isCalendarVisible,
      setCalendarVisible: state.setCalendarVisible,
    }))
  );
  const { icsUrl, events, loading, error, setIcsUrl, clearCalendar, loadEvents } = useCalendarStore(
    useShallow((state) => ({
      icsUrl: state.icsUrl,
      events: state.events,
      loading: state.loading,
      error: state.error,
      setIcsUrl: state.setIcsUrl,
      clearCalendar: state.clearCalendar,
      loadEvents: state.loadEvents,
    }))
  );

  const isConnected = !!icsUrl;

  useEffect(() => {
    if (isCalendarVisible && icsUrl) {
      loadEvents(true);
    }
  }, [isCalendarVisible, icsUrl, loadEvents]);

  const formatTimeRemaining = (event: CalendarEvent): string => {
    try {
      const now = new Date();
      const eventStart = getEventStartDate(event);
      const eventEnd = getEventEndDate(event);

      if (isAllDayEvent(event)) {
        if (isEventHappening(event, now)) {
          return "All day";
        }
        const startDiffMs = eventStart.getTime() - now.getTime();
        const days = Math.floor(startDiffMs / (1000 * 60 * 60 * 24));
        if (days === 0) return "Today";
        if (days === 1) return "Tomorrow";
        return `${days} days remaining`;
      }

      if (isEventHappening(event, now)) {
        const endDiffMs = eventEnd.getTime() - now.getTime();
        const endMinutes = Math.floor(endDiffMs / (1000 * 60));

        if (endMinutes <= 0) return "Ending now";
        if (endMinutes < 60) return `${endMinutes} minutes left`;

        const endHours = Math.floor(endMinutes / 60);
        return `${endHours} hours left`;
      }

      const startDiffMs = eventStart.getTime() - now.getTime();

      if (startDiffMs <= 0) return "Now";

      const minutes = Math.floor(startDiffMs / (1000 * 60));
      if (minutes < 60) return `${minutes} minutes remaining`;

      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hours remaining`;

      const days = Math.floor(hours / 24);
      return `${days} days remaining`;
    } catch (error) {
      console.error("Error formatting time remaining:", error);
      return "Time unknown";
    }
  };

  const formatEventTime = (event: CalendarEvent): string => {
    try {
      const start = getEventStartDate(event);
      const end = getEventEndDate(event);

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

      if (isAllDayEvent(event)) {
        const startDate = formatDate(start);
        const endDate = formatDate(end);

        if (start.toDateString() === end.toDateString()) {
          return `${startDate} • All day`;
        }

        return `${startDate} – ${endDate}`;
      }

      if (start.toDateString() === end.toDateString()) {
        return `${formatDate(start)} • ${formatTime(start)} – ${formatTime(end)}`;
      }

      return `${formatDate(start)} ${formatTime(start)} – ${formatDate(end)} ${formatTime(end)}`;
    } catch (error) {
      console.error("Error formatting event time:", error);
      return "Time unavailable";
    }
  };

  const copyMeetingLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast.success(t("calendar.sheet.meetingLinkCopied", { defaultValue: "Meeting link copied" }));
  };

  const getMeetingLink = (event: CalendarEvent): string | null => {
    if (event.hangoutLink) {
      return event.hangoutLink;
    }

    if (event.conferenceData?.entryPoints?.length) {
      const videoEntry = event.conferenceData.entryPoints.find(
        (entry) => entry.entryPointType === "video"
      );
      if (videoEntry?.uri) {
        return videoEntry.uri;
      }
      return event.conferenceData.entryPoints[0].uri;
    }

    return null;
  };

  const categorizeEvents = () => {
    const now = new Date();
    const happeningNow: CalendarEvent[] = [];
    const today: CalendarEvent[] = [];
    const upcoming: CalendarEvent[] = [];

    events.forEach((event) => {
      try {
        const eventEnd = getEventEndDate(event);

        if (eventEnd <= now) return;

        if (isEventHappening(event, now)) {
          happeningNow.push(event);
        } else if (isEventToday(event, now)) {
          today.push(event);
        } else {
          upcoming.push(event);
        }
      } catch (error) {
        console.error("Error categorizing event:", error);
      }
    });

    const sortByStart = (a: CalendarEvent, b: CalendarEvent) => {
      try {
        return getEventStartDate(a).getTime() - getEventStartDate(b).getTime();
      } catch {
        return 0;
      }
    };

    return {
      happeningNow: happeningNow.sort(sortByStart),
      today: today.sort(sortByStart),
      upcoming: upcoming.sort(sortByStart).slice(0, 10),
    };
  };

  const handleConnect = async () => {
    if (!urlInput.trim()) return;
    await setIcsUrl(urlInput.trim());
    setUrlInput("");
  };

  const handleDisconnect = () => {
    clearCalendar();
  };

  const handleRefresh = () => {
    loadEvents(true);
  };

  return (
    <Sheet open={isCalendarVisible} onOpenChange={setCalendarVisible}>
      <SheetContent
        side="right"
        className="flex flex-col gap-4 p-6 sm:max-w-sm"
      >
        <SheetHeader>
          <SheetTitle>
            {t("calendar.sheet.title", { defaultValue: "Calendar" })}
          </SheetTitle>
        </SheetHeader>

        {isConnected ? (
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            <div className="flex items-center justify-between p-2">
              <div className="text-sm text-green-600">
                ✓ {t("calendar.sheet.connected", { defaultValue: "Connected" })}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Button onClick={handleDisconnect} variant="outline" size="sm">
                  {t("calendar.sheet.disconnect", { defaultValue: "Disconnect" })}
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                {error}
              </div>
            )}

            <EventsList
              categorizeEvents={categorizeEvents}
              formatEventTime={formatEventTime}
              formatTimeRemaining={formatTimeRemaining}
              getMeetingLink={getMeetingLink}
              copyMeetingLink={copyMeetingLink}
              getCalendarColor={getCalendarColor}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center text-center py-4">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                {t("calendar.sheet.connectTitle", { defaultValue: "Connect Your Calendar" })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("calendar.sheet.connectSubtitle", { defaultValue: "View your events right from your new tab" })}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("calendar.sheet.howToConnect", { defaultValue: "How to get your ICS URL" })}
              </p>
              <div className="space-y-2">
                <div className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <span className="flex-shrink-0 size-5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-semibold flex items-center justify-center">1</span>
                  <p className="text-sm text-muted-foreground">
                    {t("calendar.sheet.step1", { defaultValue: "Open Google Calendar settings" })}
                  </p>
                </div>
                <div className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <span className="flex-shrink-0 size-5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-semibold flex items-center justify-center">2</span>
                  <p className="text-sm text-muted-foreground">
                    {t("calendar.sheet.step2", { defaultValue: "Select your calendar → Integrate calendar" })}
                  </p>
                </div>
                <div className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <span className="flex-shrink-0 size-5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-semibold flex items-center justify-center">3</span>
                  <p className="text-sm text-muted-foreground">
                    {t("calendar.sheet.step3", { defaultValue: "Copy \"Secret address in iCal format\"" })}
                  </p>
                </div>
              </div>
              <a
                href="https://calendar.google.com/calendar/r/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-400 transition-colors"
              >
                <ExternalLink className="size-3" />
                {t("calendar.sheet.openSettings", { defaultValue: "Open Google Calendar Settings" })}
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <Input
                placeholder="https://calendar.google.com/calendar/ical/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="text-sm"
              />
              <Button onClick={handleConnect} disabled={loading || !urlInput.trim()}>
                {loading ? t("common.loading", { defaultValue: "Loading..." }) : t("calendar.sheet.connect", { defaultValue: "Connect Calendar" })}
              </Button>
            </div>

            {error && (
              <div className="text-sm text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                {error}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

interface EventsListProps {
  categorizeEvents: () => {
    happeningNow: CalendarEvent[];
    today: CalendarEvent[];
    upcoming: CalendarEvent[];
  };
  formatEventTime: (event: CalendarEvent) => string;
  formatTimeRemaining: (event: CalendarEvent) => string;
  getMeetingLink: (event: CalendarEvent) => string | null;
  copyMeetingLink: (link: string) => Promise<void>;
  getCalendarColor: (colorId?: string) => string;
}

const EventsList: React.FC<EventsListProps> = ({
  categorizeEvents,
  formatEventTime,
  formatTimeRemaining,
  getMeetingLink,
  copyMeetingLink,
  getCalendarColor,
}) => {
  const { t } = useTranslation();
  const { happeningNow, today, upcoming } = categorizeEvents();
  const [happeningNowOpen, setHappeningNowOpen] = useState(true);
  const [upcomingOpen, setUpcomingOpen] = useState(false);

  const totalEvents = happeningNow.length + today.length + upcoming.length;

  if (totalEvents === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        {t("calendar.sheet.noEvents", { defaultValue: "No upcoming events" })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
      {happeningNow.length > 0 && (
        <Collapsible open={happeningNowOpen} onOpenChange={setHappeningNowOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg transition-colors">
            <span className="text-sm font-semibold text-card-foreground">
              {t("calendar.sheet.happeningNow", { defaultValue: "Happening Now" })} ({happeningNow.length})
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                happeningNowOpen ? "transform rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-3 mt-2">
            {happeningNow.map((event) => (
              <CompactEventCard
                key={event.id}
                event={event}
                formatTimeRemaining={formatTimeRemaining}
                getMeetingLink={getMeetingLink}
                getCalendarColor={getCalendarColor}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {today.length > 0 && (
        <div>
          <div className="flex items-center justify-between w-full p-2">
            <span className="text-sm font-semibold text-card-foreground">
              {t("calendar.sheet.today", { defaultValue: "Today" })} ({today.length})
            </span>
          </div>
          <div className="flex flex-col gap-4 mt-2">
            {today.map((event) => (
              <FullEventCard
                key={event.id}
                event={event}
                formatEventTime={formatEventTime}
                formatTimeRemaining={formatTimeRemaining}
                getMeetingLink={getMeetingLink}
                copyMeetingLink={copyMeetingLink}
                getCalendarColor={getCalendarColor}
              />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <Collapsible open={upcomingOpen} onOpenChange={setUpcomingOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg transition-colors">
            <span className="text-sm font-semibold text-card-foreground">
              {t("calendar.sheet.upcoming", { defaultValue: "Upcoming" })} ({upcoming.length})
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                upcomingOpen ? "transform rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-4 mt-2">
            {upcoming.map((event) => (
              <FullEventCard
                key={event.id}
                event={event}
                formatEventTime={formatEventTime}
                formatTimeRemaining={formatTimeRemaining}
                getMeetingLink={getMeetingLink}
                copyMeetingLink={copyMeetingLink}
                getCalendarColor={getCalendarColor}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

interface CompactEventCardProps {
  event: CalendarEvent;
  formatTimeRemaining: (event: CalendarEvent) => string;
  getMeetingLink: (event: CalendarEvent) => string | null;
  getCalendarColor: (colorId?: string) => string;
}

const CompactEventCard: React.FC<CompactEventCardProps> = ({
  event,
  formatTimeRemaining,
  getMeetingLink,
  getCalendarColor,
}) => {
  const eventColor = getCalendarColor(event.colorId);
  const meetingLink = getMeetingLink(event);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="size-2.5 rounded-full flex-shrink-0 animate-pulse"
          style={{ backgroundColor: eventColor }}
        />
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h4 className="text-sm font-medium text-card-foreground truncate">
            {event.summary || "Untitled Event"}
          </h4>
          <span className="text-xs text-muted-foreground">
            {formatTimeRemaining(event)}
          </span>
        </div>
      </div>
      {meetingLink && (
        <Button
          size="sm"
          className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-full flex-shrink-0"
          onClick={() => window.open(meetingLink, "_blank")}
        >
          <Share className="w-3 h-3 mr-1" />
          Join
        </Button>
      )}
    </div>
  );
};

interface FullEventCardProps {
  event: CalendarEvent;
  formatEventTime: (event: CalendarEvent) => string;
  formatTimeRemaining: (event: CalendarEvent) => string;
  getMeetingLink: (event: CalendarEvent) => string | null;
  copyMeetingLink: (link: string) => Promise<void>;
  getCalendarColor: (colorId?: string) => string;
}

const FullEventCard: React.FC<FullEventCardProps> = ({
  event,
  formatEventTime,
  formatTimeRemaining,
  getMeetingLink,
  copyMeetingLink,
  getCalendarColor,
}) => {
  const eventColor = getCalendarColor(event.colorId);
  const meetingLink = getMeetingLink(event);

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-card border border-border/50">
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

      <p className="text-sm text-muted-foreground">{formatEventTime(event)}</p>

      {meetingLink && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground font-mono truncate flex-1">
            {meetingLink.replace("https://", "")}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 flex-shrink-0"
            onClick={() => copyMeetingLink(meetingLink)}
            title="Copy meeting link"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bell className="w-4 h-4" />
        <span>{formatTimeRemaining(event)}</span>
      </div>
    </div>
  );
};
