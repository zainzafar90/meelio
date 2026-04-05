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
import { cn } from "../../../lib/utils";
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
  } = timerStore(
    useShallow((state) => ({
      stage: state.stage,
      isRunning: state.isRunning,
      prevRemaining: state.prevRemaining,
      endTimestamp: state.endTimestamp,
      durations: state.durations,
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
  const { isTimerVisible } = useDockStore(
    useShallow((state) => ({
      isTimerVisible: state.isTimerVisible,
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

  const showTimerPanel = isTimerVisible || isRunning;

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
              calendarPillValue={getAgendaPillValue(nextEvent)}
              queuedTaskCount={taskPillSummary.queuedCount}
              focusTasks={focusTasks}
              isTaskBootstrapPending={isTaskBootstrapPending}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HomeModeShell = ({
  calendarPillValue,
  queuedTaskCount,
  focusTasks,
  isTaskBootstrapPending,
}: {
  calendarPillValue: string;
  queuedTaskCount: number;
  focusTasks: Array<{ id: string; title: string; pinned: boolean }>;
  isTaskBootstrapPending: boolean;
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
      <div className="max-w-4xl space-y-6">
        <Clock />
        <div className="space-y-2">
          <div className="[&_h2]:mb-0 [&_h2]:mt-0 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight sm:[&_h2]:text-3xl md:[&_h2]:text-4xl">
            <Greeting />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {isTaskBootstrapPending ? (
            <motion.div
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-black/28 px-4 text-sm text-white/78 backdrop-blur-md"
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="size-2 rounded-full bg-white/72" />
              Loading focus ritual
            </motion.div>
          ) : focusTasks.length > 0 ? (
            focusTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm text-white/82 backdrop-blur-md",
                  task.pinned
                    ? "border-white/16 bg-white/14 shadow-[0_10px_30px_rgba(0,0,0,0.14)]"
                    : "border-white/10 bg-black/24",
                )}
              >
                {task.pinned ? <span className="size-2 rounded-full bg-amber-300" /> : null}
                <span className="max-w-[180px] truncate">{task.title}</span>
              </div>
            ))
          ) : null}
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
