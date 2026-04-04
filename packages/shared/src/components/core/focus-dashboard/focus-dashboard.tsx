import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import { useShallow } from "zustand/shallow";

import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";

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
          activeFocusTaskLabel={snapshot.activeFocusTaskLabel}
          topTasksCompleted={snapshot.topTasksCompleted}
          agendaLabel={agendaSummary.label}
        />
      ) : (
        <HomeModeShell
          headline={snapshot.headline}
          currentTimerLabel={snapshot.currentTimerLabel}
          agendaWindowLabel={snapshot.agendaWindowLabel}
          activeFocusTaskLabel={snapshot.activeFocusTaskLabel}
          primaryActionLabel={
            snapshot.primaryAction.kind === "review-plan"
              ? "Open Tasks"
              : snapshot.primaryAction.label
          }
          primaryActionDescription={
            snapshot.primaryAction.kind === "review-plan"
              ? "Pick or pin a task before starting a focus session."
              : snapshot.primaryAction.description
          }
          agendaSummary={agendaSummary}
          blockerMode={snapshot.blockerMode}
          soundtrackMode={snapshot.soundtrackMode}
          topTasksTotal={snapshot.topTasksTotal}
          onPrimaryAction={handlePrimaryAction}
        />
      )}
    </div>
  );
};

const HomeModeShell = ({
  headline,
  currentTimerLabel,
  agendaWindowLabel,
  activeFocusTaskLabel,
  primaryActionLabel,
  primaryActionDescription,
  agendaSummary,
  blockerMode,
  soundtrackMode,
  topTasksTotal,
  onPrimaryAction,
}: {
  headline: string;
  currentTimerLabel: string;
  agendaWindowLabel: string;
  activeFocusTaskLabel: string;
  primaryActionLabel: string;
  primaryActionDescription: string;
  agendaSummary: ReturnType<typeof getAgendaSummary>;
  blockerMode: string;
  soundtrackMode: string;
  topTasksTotal: number;
  onPrimaryAction: () => void;
}) => (
  <div className="flex min-h-0 flex-1 items-center justify-center">
    <div className="grid h-full w-full max-w-[1600px] grid-rows-[auto_1fr_auto] gap-4">
      <div className="flex items-start justify-between gap-6 px-2 py-2">
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

      <div className="flex min-h-0 flex-col items-center justify-center px-4 text-center">
        <div className="space-y-6 px-6 py-8 sm:px-10">
          <div className="flex flex-col items-center gap-4">
            <Clock />
            <Greeting />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl">
              {headline}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] sm:text-lg">
              {currentTimerLabel}. {agendaWindowLabel}
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={onPrimaryAction}
              className="h-12 rounded-full border border-white/15 bg-black/65 px-8 text-base text-white shadow-xl backdrop-blur-md hover:bg-black/75"
            >
              {primaryActionLabel}
            </Button>
            <p className="text-sm text-white/82 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
              {primaryActionDescription}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-2 py-2 lg:grid-cols-[minmax(0,360px)_minmax(0,420px)] lg:justify-between">
        <div className="rounded-3xl border border-white/12 bg-black/45 p-4 text-left shadow-xl backdrop-blur-lg">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">
            Active Focus Task
          </p>
          <p className="mt-2 text-base font-medium text-white sm:text-lg">
            {activeFocusTaskLabel}
          </p>
        </div>
        <Card className="border-white/12 bg-black/45 text-white shadow-xl backdrop-blur-lg">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">
                  Next on your calendar
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {agendaSummary.summary}
                </p>
              </div>
              <Badge variant="secondary" className="border-white/10 bg-white/10 text-white">
                {agendaSummary.label}
              </Badge>
            </div>
            <p className="text-sm text-white/75">{agendaSummary.detail}</p>
          </CardContent>
        </Card>
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
  <div className="flex min-h-0 flex-1 items-center justify-center">
    <div className="flex h-full w-full max-w-[1600px] flex-col">
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-3 text-white">
          <Badge variant="secondary" className="border-white/20 bg-black/35 text-white shadow-lg backdrop-blur-md">
            Focusing
          </Badge>
          <span className="text-sm text-white/82">{currentTimerLabel}</span>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <InfoBadge label="Today" value={`${topTasksCompleted} done`} />
          <InfoBadge label="Calendar" value={agendaLabel} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
        <div className="flex w-full max-w-5xl flex-col items-center gap-6">
          <div className="space-y-2 text-center">
            <p className="text-sm uppercase tracking-[0.24em] text-white/70">
              Active Focus Task
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {activeFocusTaskLabel}
            </h2>
          </div>
          <div className="w-full max-w-3xl sm:p-2">
            {timerPanel}
          </div>
        </div>
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
  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/32 px-3 py-1.5 shadow-lg backdrop-blur-lg">
    <span className="text-[10px] uppercase tracking-[0.2em] text-white/68">
      {label}
    </span>
    <span className="text-xs font-medium capitalize text-white/96">{value}</span>
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
