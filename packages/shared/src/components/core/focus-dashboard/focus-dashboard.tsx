import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import { useShallow } from "zustand/shallow";

import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Progress } from "@repo/ui/components/ui/progress";
import { Textarea } from "@repo/ui/components/ui/textarea";

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
import { QuickCaptureBar } from "../quick-capture/quick-capture-bar";

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
  } =
    timerStore(
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
  const { tasks, toggleTask, togglePinTask } = useTaskStore(
    useShallow((state) => ({
      tasks: state.tasks,
      toggleTask: state.toggleTask,
      togglePinTask: state.togglePinTask,
    }))
  );
  const blockedSites = useSiteBlockerStore(useShallow((state) => state.sites));
  const playingSounds = useSoundscapesStore(
    useShallow((state) => state.sounds.filter((sound) => sound.playing).length)
  );
  const nextEvent = useCalendarStore(useShallow((state) => state.nextEvent));
  const { isTimerVisible, setTimerVisible, setGreetingsVisible } = useDockStore(
    useShallow((state) => ({
      isTimerVisible: state.isTimerVisible,
      setTimerVisible: state.setTimerVisible,
      setGreetingsVisible: state.setGreetingsVisible,
    }))
  );
  const { dailyPlan, snapshot } = useFocusDashboardStore(
    useShallow((state) => ({
      dailyPlan: state.dailyPlan,
      snapshot: state.snapshot,
    }))
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

  const completionPercentage =
    snapshot.topTasksTotal === 0
      ? 0
      : (snapshot.topTasksCompleted / snapshot.topTasksTotal) * 100;
  const taskDetails = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks]
  );
  const activeFocusTask = snapshot.activeFocusTaskId
    ? taskDetails.get(snapshot.activeFocusTaskId)
    : undefined;
  const agendaSummary = useMemo(
    () => getAgendaSummary(nextEvent),
    [nextEvent]
  );
  const isFocusReady = dailyPlan.topTasks.length > 0 || dailyPlan.headline.trim().length > 0;

  const handlePrimaryAction = () => {
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

  const showTimerPanel = isTimerVisible || isRunning;

  return (
    <div className="flex w-full max-w-6xl flex-col gap-8 px-4 pb-6 pt-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <Card className="border-white/10 bg-black/20 text-white shadow-2xl backdrop-blur-xl">
          <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="space-y-5 text-center lg:text-left">
              <div className="flex flex-col items-center gap-4 lg:items-start">
                <Clock />
                <Greeting />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {snapshot.headline}
                </h2>
                <p className="text-sm text-white/70 sm:max-w-2xl sm:text-base">
                  {snapshot.currentTimerLabel}. {snapshot.agendaWindowLabel}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                    Active Focus Task
                  </p>
                  <p className="mt-2 text-base font-medium text-white">
                    {snapshot.activeFocusTaskLabel}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <InfoBadge label="Focus" value={snapshot.currentTimerLabel} />
                    <InfoBadge label="Blocker" value={snapshot.blockerMode} />
                    <InfoBadge label="Sound" value={snapshot.soundtrackMode} />
                  </div>
                </div>
                <QuickCaptureBar />
              </div>
              <div className="flex flex-col gap-3 lg:w-[240px]">
                <Button
                  onClick={handlePrimaryAction}
                  className="h-12 rounded-2xl bg-white text-black hover:bg-white/90"
                >
                  {snapshot.primaryAction.label}
                </Button>
                <p className="text-sm text-white/60 lg:text-right">
                  {snapshot.primaryAction.description}
                </p>
                {!isFocusReady && (
                  <p className="text-sm text-amber-200/80 lg:text-right">
                    Add a headline or pin a task to make this session more intentional.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-black/20 text-white shadow-xl backdrop-blur-xl">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl">Daily Focus Plan</CardTitle>
              <p className="text-sm text-white/60">
                Set the tone, then keep one short reflection attached to the day.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={dailyPlan.headline}
                onChange={(event) =>
                  updateDailyFocusPlan({ headline: event.target.value })
                }
                placeholder="What matters most today?"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/35"
              />
              <Textarea
                value={dailyPlan.intention}
                onChange={(event) =>
                  updateDailyFocusPlan({ intention: event.target.value })
                }
                placeholder="Define the intention for this session."
                className="min-h-[96px] border-white/10 bg-white/5 text-white placeholder:text-white/35"
              />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input
                  type="number"
                  min={0}
                  value={dailyPlan.sessionTarget}
                  onChange={(event) =>
                    updateDailyFocusPlan({
                      sessionTarget: Number(event.target.value || 0),
                    })
                  }
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/35"
                />
                <Badge variant="secondary" className="justify-center border-white/10 bg-white/10 text-white">
                  {snapshot.topTasksCompleted}/{snapshot.topTasksTotal} done
                </Badge>
              </div>
              <Progress value={completionPercentage} className="bg-white/10" />
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">
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
                <p className="mt-2 text-sm text-white/55">
                  {agendaSummary.detail}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/20 text-white shadow-xl backdrop-blur-xl">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl">Top Tasks</CardTitle>
              <p className="text-sm text-white/60">
                Pulled from your current task state and pinned for focus.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {dailyPlan.topTasks.length > 0 ? (
                dailyPlan.topTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs text-white/70">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {taskDetails.get(task.id)?.pinned
                            ? "Pinned for the current focus window."
                            : activeFocusTask
                              ? "Available if you want to replace the current focus task."
                              : "Available to promote into focus."}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => void toggleTask(task.id)}
                        className="h-8 rounded-lg border border-white/10 bg-transparent px-3 text-white hover:bg-white/10"
                      >
                        Complete
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void togglePinTask(task.id)}
                        className="h-8 rounded-lg border border-white/10 bg-transparent px-3 text-white hover:bg-white/10"
                      >
                        {taskDetails.get(task.id)?.pinned ? "Remove Focus" : "Focus This"}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/60">
                  Add or pin a task to make the daily plan actionable.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showTimerPanel && <div className="flex justify-center">{timerPanel}</div>}
    </div>
  );
};

const InfoBadge = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
    <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">{label}</span>
    <span className="text-xs font-medium capitalize text-white">{value}</span>
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
        : `Ends later today.`,
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
    label: minutesUntil !== null && minutesUntil < 60 ? "Coming up soon" : "Next on your calendar",
    summary: event.summary ?? "Upcoming event",
    detail:
      minutesUntil === null
        ? formattedTime
        : minutesUntil < 60
          ? `Starts in ${minutesUntil} min at ${formattedTime}.`
          : `Starts ${formattedTime}.`,
  };
};
