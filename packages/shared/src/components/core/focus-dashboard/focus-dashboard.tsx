import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { useAuthStore } from "../../../stores/auth.store";
import { useSiteBlockerStore } from "../../../stores/site-blocker.store";
import { useSoundscapesStore } from "../../../stores/soundscapes.store";
import { useTaskStore } from "../../../stores/task.store";
import { Clock } from "../clock";
import { Greeting } from "../greetings/greetings-mantras";
import {
  getAgendaPillValue,
  getTaskPillSummary,
} from "./focus-dashboard.helpers";

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
      pinned: Boolean(task.pinned),
    }));

export const FocusDashboard = ({
  timerStore,
  timerPanel,
}: FocusDashboardProps) => {
  const userId = useAuthStore((state) => state.user?.id);
  const {
    stage,
    isRunning,
    prevRemaining,
    endTimestamp,
    durations,
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
  const { tasks, initializeTaskStore, isTaskStoreLoading, hasTaskStoreInitialized } = useTaskStore(
    useShallow((state) => ({
      tasks: state.tasks,
      initializeTaskStore: state.initializeStore,
      isTaskStoreLoading: state.isLoading,
      hasTaskStoreInitialized: state.hasInitialized,
    })),
  );
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
  } = useDockStore(
    useShallow((state) => ({
      isTimerVisible: state.isTimerVisible,
      setTimerVisible: state.setTimerVisible,
      setGreetingsVisible: state.setGreetingsVisible,
      setTasksVisible: state.setTasksVisible,
    })),
  );
  const snapshot = useFocusDashboardStore(
    useShallow((state) => state.snapshot),
  );
  const reduceMotion = useReducedMotion();
  const isTaskBootstrapPending =
    Boolean(userId) && (!hasTaskStoreInitialized || isTaskStoreLoading);

  const focusTasks = useMemo(() => selectFocusTasks(tasks), [tasks]);
  const taskPillSummary = useMemo(() => getTaskPillSummary(tasks), [tasks]);
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
    if (!userId) {
      return;
    }

    void initializeTaskStore();
  }, [initializeTaskStore, userId]);

  useEffect(() => {
    if (isTaskBootstrapPending) {
      return;
    }

    updateDailyFocusPlan({ topTasks: focusTasks });
  }, [focusTasks, isTaskBootstrapPending]);

  useEffect(() => {
    syncFocusDashboardSignals({
      timerRunning: isRunning,
      timerStage: stage,
      timerLabel: isRunning
        ? `${formatTime(timerRemaining)} remaining`
        : "Ready to focus",
      sessionFocusTaskId: isRunning ? snapshot.sessionFocusTaskId : null,
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
  const primaryActionLabel = isTaskBootstrapPending
    ? "Loading focus..."
    : snapshot.primaryAction.kind === "review-plan"
      ? "Open Tasks"
      : snapshot.primaryAction.kind === "choose-focus-task"
        ? "Choose Focus Task"
        : snapshot.primaryAction.kind === "switch-focus-task"
          ? "Switch Focus Task"
          : "Start Focusing";
  const primaryActionDescription = isTaskBootstrapPending
    ? "Pulling in your pinned task and today's queue."
    : snapshot.primaryAction.kind === "review-plan" ||
        snapshot.primaryAction.kind === "choose-focus-task"
      ? "Pick or pin a task to anchor the next focus block."
      : snapshot.agendaWindowLabel;

  const handlePrimaryAction = () => {
    if (isTaskBootstrapPending) {
      return;
    }

    if (
      snapshot.primaryAction.kind === "review-plan" ||
      snapshot.primaryAction.kind === "choose-focus-task"
    ) {
      setTasksVisible(true);
      setTimerVisible(false);
      return;
    }

    setTasksVisible(false);
    setGreetingsVisible(false);
    setTimerVisible(true);

    syncFocusDashboardSignals({
      timerRunning: isRunning,
      timerStage: stage,
      timerLabel: isRunning
        ? `${formatTime(timerRemaining)} remaining`
        : "Ready to focus",
      sessionFocusTaskId:
        snapshot.primaryAction.kind === "start-focus-session" ||
        snapshot.primaryAction.kind === "switch-focus-task"
          ? snapshot.activeFocusTaskId
          : snapshot.sessionFocusTaskId,
      blockerMode: blockedSites.length > 0 && isRunning ? "active" : "ready",
      soundtrackMode: playingSounds > 0 ? "playing" : "available",
      nextEventLabel: nextEvent?.summary ? `Next: ${nextEvent.summary}` : "",
      minutesUntilEvent: nextEvent ? getMinutesUntilEvent(nextEvent) : null,
    });

    if (!isRunning) {
      start();
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-2 pb-2 pt-2 sm:px-4">
      <AnimatePresence mode="wait" initial={false}>
        {showTimerPanel ? (
          <motion.div
            key="focus-mode"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 18, filter: "blur(10px)" }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -12, filter: "blur(8px)" }
            }
            transition={{
              duration: reduceMotion ? 0.18 : 0.3,
              ease: "easeOut",
            }}
            className="flex min-h-0 flex-1"
          >
            <FocusModeShell
              timerPanel={timerPanel}
              currentTimerLabel={snapshot.currentTimerLabel}
              activeFocusTaskLabel={snapshot.activeFocusTaskLabel}
              completedTaskCount={taskPillSummary.completedCount}
              calendarPillValue={getAgendaPillValue(nextEvent)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="home-mode"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 14, filter: "blur(10px)" }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, filter: "blur(0px)" }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -10, filter: "blur(8px)" }
            }
            transition={{
              duration: reduceMotion ? 0.18 : 0.28,
              ease: "easeOut",
            }}
            className="flex min-h-0 flex-1"
          >
            <HomeModeShell
              primaryActionLabel={primaryActionLabel}
              primaryActionDescription={primaryActionDescription}
              isPrimaryActionPending={isTaskBootstrapPending}
              onPrimaryAction={handlePrimaryAction}
              calendarPillValue={getAgendaPillValue(nextEvent)}
              queuedTaskCount={taskPillSummary.queuedCount}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HomeModeShell = ({
  primaryActionLabel,
  primaryActionDescription,
  isPrimaryActionPending,
  onPrimaryAction,
  calendarPillValue,
  queuedTaskCount,
}: {
  primaryActionLabel: string;
  primaryActionDescription: string;
  isPrimaryActionPending: boolean;
  onPrimaryAction: () => void;
  calendarPillValue: string;
  queuedTaskCount: number;
}) => (
  <div className="relative flex min-h-0 flex-1 flex-col">
    <div className="absolute inset-x-0 top-0 z-10 hidden items-start justify-between gap-3 px-4 py-3 [@media(min-height:580px)]:flex">
      <AmbientPill
        icon={<CalendarDays className="size-3.5" />}
        label="Calendar"
        value={calendarPillValue}
      />
      <AmbientPill
        icon={<CheckSquare2 className="size-3.5" />}
        label="Tasks"
        value={`${queuedTaskCount} queued`}
      />
    </div>

    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="max-w-4xl space-y-4">
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
            disabled={isPrimaryActionPending}
            onClick={onPrimaryAction}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black/55 px-8 text-base font-medium text-white shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-md transition-colors hover:bg-black/68 disabled:cursor-default disabled:bg-black/42 disabled:text-white/82"
          >
            {isPrimaryActionPending ? (
              <motion.span
                aria-hidden="true"
                className="size-2 rounded-full bg-white/78"
                animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.15, 0.9] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : null}
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
  completedTaskCount,
  calendarPillValue,
}: {
  timerPanel: ReactNode;
  currentTimerLabel: string;
  activeFocusTaskLabel: string;
  completedTaskCount: number;
  calendarPillValue: string;
}) => (
  <div className="relative flex min-h-0 flex-1 items-center justify-center">
    <div className="pointer-events-none absolute inset-0 bg-black/7 backdrop-blur-[8px]" />
    <div className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_18%),radial-gradient(circle_at_center,rgba(0,0,0,0.20),transparent_58%),linear-gradient(to_bottom,rgba(0,0,0,0.13),transparent_28%)]" />
    <div className="relative flex h-full w-full max-w-full flex-col">
      <div className="hidden items-center justify-between px-4 py-3 [@media(min-height:580px)]:flex">
        <AmbientPill
          icon={<CalendarDays className="size-3.5" />}
          label="Calendar"
          value={calendarPillValue}
        />
        <AmbientPill
          icon={<Timer className="size-3.5" />}
          label="Focus"
          value={currentTimerLabel}
        />
        <AmbientPill
          icon={<CheckSquare2 className="size-3.5" />}
          label="Today"
          value={`${completedTaskCount} done`}
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
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.985 }}
          transition={{ duration: 0.28, ease: "easeOut", delay: 0.04 }}
          className="w-full"
        >
          {timerPanel}
        </motion.div>
      </div>
    </div>
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
  <div className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/16 px-3.5 text-sm text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl sm:h-10 sm:gap-3 sm:px-5">
    {icon && <span className="text-white/88">{icon}</span>}
    <span className="hidden md:inline text-[11px] font-medium uppercase tracking-[0.28em] text-white/68">
      {label}
    </span>
    <span className="truncate max-w-[86px] text-xs font-semibold text-white [text-shadow:_0_1px_8px_rgba(0,0,0,0.18)] sm:max-w-[132px] sm:text-sm">
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
