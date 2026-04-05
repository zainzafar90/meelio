import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import { useShallow } from "zustand/shallow";
import { CalendarDays, CheckSquare2, Timer } from "lucide-react";

import type { TimerState } from "../../../types/timer.types";
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
  }>,
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
    settings,
    start,
  } = timerStore(
    useShallow((state) => ({
      stage: state.stage,
      isRunning: state.isRunning,
      prevRemaining: state.prevRemaining,
      endTimestamp: state.endTimestamp,
      durations: state.durations,
      settings: state.settings,
      start: state.start,
    })),
  );
  const tasks = useTaskStore(useShallow((state) => state.tasks));
  const blockedSites = useSiteBlockerStore(useShallow((state) => state.sites));
  const playingSounds = useSoundscapesStore(
    useShallow((state) => state.sounds.filter((sound) => sound.playing).length),
  );
  const nextEvent = useCalendarStore(useShallow((state) => state.nextEvent));
  const {
    isTimerVisible,
    setTimerVisible,
    setGreetingsVisible,
    setTasksVisible,
    setSoundscapesVisible,
  } = useDockStore(
    useShallow((state) => ({
      isTimerVisible: state.isTimerVisible,
      setTimerVisible: state.setTimerVisible,
      setGreetingsVisible: state.setGreetingsVisible,
      setTasksVisible: state.setTasksVisible,
      setSoundscapesVisible: state.setSoundscapesVisible,
    })),
  );
  const snapshot = useFocusDashboardStore(
    useShallow((state) => state.snapshot),
  );

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
      timerLabel: isRunning
        ? `${formatTime(timerRemaining)} remaining`
        : "Ready to focus",
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

    setTasksVisible(false);
    setGreetingsVisible(false);
    setTimerVisible(true);

    if (settings.soundscapes) {
      setSoundscapesVisible(true);
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
          activeFocusTaskLabel={snapshot.activeFocusTaskLabel}
          topTasksCompleted={snapshot.topTasksCompleted}
          agendaLabel={agendaSummary.label}
        />
      ) : (
        <HomeModeShell
          primaryActionLabel={
            snapshot.primaryAction.kind === "review-plan"
              ? "Open Tasks"
              : "Start Focusing"
          }
          primaryActionDescription={
            snapshot.primaryAction.kind === "review-plan"
              ? "Pick or pin a task to anchor the next focus block."
              : snapshot.agendaWindowLabel
          }
          onPrimaryAction={handlePrimaryAction}
          agendaSummary={agendaSummary}
          topTasksTotal={snapshot.topTasksTotal}
        />
      )}
    </div>
  );
};

const HomeModeShell = ({
  primaryActionLabel,
  primaryActionDescription,
  onPrimaryAction,
  agendaSummary,
  topTasksTotal,
}: {
  primaryActionLabel: string;
  primaryActionDescription: string;
  onPrimaryAction: () => void;
  agendaSummary: ReturnType<typeof getAgendaSummary>;
  topTasksTotal: number;
}) => (
  <div className="relative flex min-h-0 flex-1 flex-col">
    <div className="absolute inset-x-0 top-0 z-10 hidden [@media(min-height:580px)]:block">
      <div className="mx-auto flex w-full max-w-full items-center justify-between gap-3 px-4 py-3">
        <AmbientPill
          icon={<CalendarDays className="size-3.5" />}
          label="Calendar"
          value={agendaSummary.label}
        />
        <AmbientPill
          icon={<CheckSquare2 className="size-3.5" />}
          label="Tasks"
          value={`${topTasksTotal} queued`}
        />
      </div>
    </div>

    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-16 pt-16 text-center sm:pb-8 sm:pt-28">
      <div className="max-w-4xl -translate-y-8 space-y-4 sm:-translate-y-10">
        <Clock />
        <div className="space-y-3">
          <div className="[&_h2]:mb-0 [&_h2]:mt-0 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight sm:[&_h2]:text-3xl md:[&_h2]:text-4xl">
            <Greeting />
          </div>
          <p className="mx-auto max-w-lg text-sm leading-6 text-white/70 sm:text-base">
            {primaryActionDescription}
          </p>
        </div>
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex h-12 items-center justify-center rounded-full bg-black/55 px-8 text-base font-medium text-white shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-md transition-colors hover:bg-black/68"
          >
            {primaryActionLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const FocusModeShell = ({
  timerPanel,
  currentTimerLabel,
  activeFocusTaskLabel,
  topTasksCompleted,
  agendaLabel,
}: {
  timerPanel: ReactNode;
  currentTimerLabel: string;
  activeFocusTaskLabel: string;
  topTasksCompleted: number;
  agendaLabel: string;
}) => (
  <div className="relative flex min-h-0 flex-1 items-center justify-center">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.08),transparent_32%),linear-gradient(to_bottom,rgba(0,0,0,0.10),transparent_28%)]" />
    <div className="relative flex h-full w-full max-w-full flex-col">
      <div className="hidden items-center justify-between px-4 py-3 [@media(min-height:580px)]:flex">
        {" "}
        <AmbientPill
          icon={<CalendarDays className="size-3.5" />}
          label="Calendar"
          value={agendaLabel}
        />{" "}
        <AmbientPill
          icon={<Timer className="size-3.5" />}
          label="Focus"
          value={currentTimerLabel}
        />
        <AmbientPill
          icon={<CheckSquare2 className="size-3.5" />}
          label="Today"
          value={`${topTasksCompleted} done`}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-4 pb-6">
        <div className="space-y-3 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/62">
            Active Focus Task
          </p>
          <h2 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white drop-shadow-[0_8px_22px_rgba(0,0,0,0.16)] sm:text-4xl">
            {activeFocusTaskLabel}
          </h2>
        </div>
        {timerPanel}
      </div>
    </div>
  </div>
);

const AmbientMeta = ({ icon, value }: { icon?: ReactNode; value: string }) => (
  <div className="inline-flex items-center gap-2 text-sm font-medium text-white/78">
    {icon && <span className="text-white/46">{icon}</span>}
    <span>{value}</span>
  </div>
);

const AmbientPill = ({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) => (
  <div className="inline-flex h-7 items-center gap-1 rounded-full bg-black/12 px-3 text-sm text-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:h-9 sm:gap-1.5 sm:px-5 md:gap-3">
    {icon && <span className="text-white/80">{icon}</span>}
    <span className="hidden md:inline text-xs font-medium uppercase tracking-[0.28em] text-white/58">
      {label}
    </span>
    <span className="truncate max-w-[72px] sm:max-w-[120px] md:max-w-none text-xs sm:text-sm font-semibold text-white">
      {value}
    </span>
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
      detail: isAllDayEvent(event)
        ? "This is an all-day event."
        : "Ends later today.",
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
