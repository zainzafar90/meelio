import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import { useShallow } from "zustand/shallow";

import type { TimerState } from "../../../types/timer.types";
import { Category } from "../../../types/category";
import type { CalendarEvent } from "../../../types/calendar.types";
import { formatTime } from "../../../utils/timer.utils";
import {
  getEventStartDate,
  getMinutesUntilEvent,
  isAllDayEvent,
  isEventHappening,
} from "../../../utils/calendar-date.utils";
import { useCalendarStore } from "../../../stores/calendar.store";
import { useDockStore } from "../../../stores/dock.store";
import {
  initializeFocusDashboardStore,
  syncFocusDashboardSignals,
  updateDailyFocusPlan,
  useFocusDashboardStore,
} from "../../../stores/focus-dashboard.store";
import { useSiteBlockerStore } from "../../../stores/site-blocker.store";
import { useSoundscapesStore } from "../../../stores/soundscapes.store";
import { useTaskStore } from "../../../stores/task.store";
import { Clock } from "../clock";
import { Greeting } from "../greetings/greetings-mantras";

type TimerStoreHook = UseBoundStore<StoreApi<TimerState>>;

interface FocusDashboardProps {
  timerStore: TimerStoreHook;
  timerPanel: ReactNode;
}

const selectFocusTasks = (
  tasks: Array<{
    id: string;
    title: string;
    completed?: boolean;
    pinned?: boolean;
    deletedAt?: number | null;
    updatedAt?: number;
  }>
) =>
  tasks
    .filter((task) => !task.completed && !task.deletedAt)
    .sort((left, right) => {
      if (Boolean(left.pinned) !== Boolean(right.pinned)) {
        return left.pinned ? -1 : 1;
      }

      return (right.updatedAt ?? 0) - (left.updatedAt ?? 0);
    })
    .slice(0, 3)
    .map((task) => ({
      id: task.id,
      title: task.title,
      completed: false,
    }));

export const FocusDashboard = ({
  timerStore,
  timerPanel,
}: FocusDashboardProps) => {
  const {
    stage,
    isRunning,
    prevRemaining,
    endTimestamp,
    durations,
    start,
    settings,
  } = timerStore(
    useShallow((state) => ({
      stage: state.stage,
      isRunning: state.isRunning,
      prevRemaining: state.prevRemaining,
      endTimestamp: state.endTimestamp,
      durations: state.durations,
      start: state.start,
      settings: state.settings,
    }))
  );
  const tasks = useTaskStore(useShallow((state) => state.tasks));
  const blockedSites = useSiteBlockerStore(useShallow((state) => state.sites));
  const playingSounds = useSoundscapesStore(
    useShallow((state) => state.sounds.filter((sound) => sound.playing).length)
  );
  const nextEvent = useCalendarStore(useShallow((state) => state.nextEvent));
  const {
    isTimerVisible,
    setTimerVisible,
    setGreetingsVisible,
    setTasksVisible,
  } = useDockStore(
    useShallow((state) => ({
      isTimerVisible: state.isTimerVisible,
      setTimerVisible: state.setTimerVisible,
      setGreetingsVisible: state.setGreetingsVisible,
      setTasksVisible: state.setTasksVisible,
    }))
  );
  const snapshot = useFocusDashboardStore(useShallow((state) => state.snapshot));

  const focusTasks = useMemo(() => selectFocusTasks(tasks), [tasks]);
  const timerRemaining = useMemo(() => {
    if (!isRunning && prevRemaining !== null) {
      return prevRemaining;
    }

    if (isRunning && endTimestamp) {
      return Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
    }

    return durations[stage];
  }, [durations, endTimestamp, isRunning, prevRemaining, stage]);

  useEffect(() => {
    initializeFocusDashboardStore();
  }, []);

  useEffect(() => {
    updateDailyFocusPlan({ topTasks: focusTasks });
  }, [focusTasks]);

  useEffect(() => {
    syncFocusDashboardSignals({
      timerRunning: isRunning,
      timerStage: stage,
      timerLabel: isRunning ? `${formatTime(timerRemaining)} remaining` : "Ready to focus",
      blockerMode: blockedSites.length > 0 && isRunning ? "active" : "ready",
      soundtrackMode: playingSounds > 0 ? "playing" : "available",
      nextEventLabel: nextEvent?.summary ? `Next: ${nextEvent.summary}` : "",
      minutesUntilEvent: nextEvent ? getMinutesUntilEvent(nextEvent) : null,
    });
  }, [
    blockedSites.length,
    isRunning,
    nextEvent,
    nextEvent?.summary,
    playingSounds,
    stage,
    timerRemaining,
  ]);

  const agendaSummary = useMemo(() => getAgendaSummary(nextEvent), [nextEvent]);
  const showTimerPanel = isTimerVisible || isRunning;

  const handlePrimaryAction = () => {
    if (snapshot.primaryAction.kind === "review-plan") {
      setTasksVisible(true);
      setTimerVisible(false);
      return;
    }

    setTimerVisible(true);
    setGreetingsVisible(false);

    if (settings.soundscapes) {
      const soundState = useSoundscapesStore.getState();
      const hasPlayingSounds = soundState.sounds.some((sound) => sound.playing);
      if (!hasPlayingSounds) {
        soundState.playCategory(Category.Productivity);
      }
    }

    if (!isRunning) {
      start();
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-2 pb-2 pt-2 sm:px-4">
      {showTimerPanel ? (
        <FocusModeShell
          timerPanel={timerPanel}
          currentTimerLabel={snapshot.currentTimerLabel}
          topTasksCompleted={snapshot.topTasksCompleted}
          agendaLabel={agendaSummary.label}
        />
      ) : (
        <HomeModeShell
          currentTimerLabel={snapshot.currentTimerLabel}
          agendaSummary={agendaSummary}
          blockerMode={snapshot.blockerMode}
          soundtrackMode={snapshot.soundtrackMode}
          topTasksTotal={snapshot.topTasksTotal}
        />
      )}
    </div>
  );
};

const HomeModeShell = ({
  currentTimerLabel,
  agendaSummary,
  blockerMode,
  soundtrackMode,
  topTasksTotal,
}: {
  currentTimerLabel: string;
  agendaSummary: ReturnType<typeof getAgendaSummary>;
  blockerMode: string;
  soundtrackMode: string;
  topTasksTotal: number;
}) => (
  <div className="relative flex min-h-0 flex-1 flex-col">
    <div className="absolute inset-x-0 top-0 z-10 hidden items-start justify-between gap-6 px-4 py-2 [@media(min-height:580px)]:flex">
      <div className="hidden flex-wrap gap-2 md:flex">
        <InfoBadge label="Focus" value={currentTimerLabel} />
        <InfoBadge label="Blocker" value={blockerMode} />
        <InfoBadge label="Sound" value={soundtrackMode} />
      </div>
      <div className="ml-auto flex flex-wrap justify-end gap-2">
        <InfoBadge label="Calendar" value={agendaSummary.label} />
        <InfoBadge label="Tasks" value={`${topTasksTotal} queued`} />
      </div>
    </div>

    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center">
      <Clock />
      <div className="mt-1">
        <Greeting />
      </div>
    </div>
  </div>
);

const FocusModeShell = ({
  timerPanel,
  currentTimerLabel,
  topTasksCompleted,
  agendaLabel,
}: {
  timerPanel: ReactNode;
  currentTimerLabel: string;
  topTasksCompleted: number;
  agendaLabel: string;
}) => (
  <div className="flex min-h-0 flex-1 items-center justify-center">
    <div className="flex h-full w-full max-w-[1600px] flex-col">
      <div className="hidden items-center justify-between px-2 py-2 [@media(min-height:580px)]:flex">
        <div className="flex items-center gap-3">
          <InfoBadge label="Focus" value={currentTimerLabel} />
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <InfoBadge label="Today" value={`${topTasksCompleted} done`} />
          <InfoBadge label="Calendar" value={agendaLabel} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
        {timerPanel}
      </div>
    </div>
  </div>
);

const InfoBadge = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/12 px-4 py-2 shadow-lg backdrop-blur-lg">
    <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-white">
      {label}
    </span>
    <span className="text-xs font-medium text-white">{value}</span>
  </div>
);

const getAgendaSummary = (event: CalendarEvent | null) => {
  if (!event) {
    return {
      label: "No upcoming event",
      summary: "Your calendar is clear.",
      detail: "This looks like a good window for deep work.",
    };
  }

  const now = new Date();
  if (isEventHappening(event, now)) {
    return {
      label: "Happening now",
      summary: event.summary ?? "Current event",
      detail: isAllDayEvent(event) ? "This is an all-day event." : "Ends later today.",
    };
  }

  const minutesUntil = getMinutesUntilEvent(event);
  const startDate = getEventStartDate(event);
  const formattedTime = isAllDayEvent(event)
    ? "All day"
    : startDate.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });

  return {
    label:
      minutesUntil !== null && minutesUntil < 60
        ? "Coming up soon"
        : "Next on your calendar",
    summary: event.summary ?? "Upcoming event",
    detail:
      minutesUntil === null
        ? formattedTime
        : minutesUntil < 60
          ? `Starts in ${minutesUntil} min at ${formattedTime}.`
          : `Starts ${formattedTime}.`,
  };
};
