import type {
  DailyFocusTask,
  FocusBlockerMode,
  FocusDashboardSnapshot,
  FocusPrimaryAction,
  FocusSoundtrackMode,
} from "@repo/contracts/focus-dashboard";
import { TimerStage } from "@repo/contracts/timer";

export type FocusDashboardCardId =
  | "focus-session"
  | "daily-plan"
  | "agenda"
  | "reflection";

export interface DeriveFocusPrimaryActionInput {
  timerRunning: boolean;
  timerStage?: TimerStage;
  topTasksCount: number;
  activeFocusTaskId?: string | null;
  activeFocusTaskLabel?: string;
  sessionFocusTaskId?: string | null;
  minutesUntilEvent?: number | null;
}

export interface DeriveFocusDashboardSnapshotInput {
  date: string;
  greeting: string;
  topTasks: DailyFocusTask[];
  timerRunning: boolean;
  timerStage: TimerStage;
  timerLabel: string;
  blockerMode: FocusBlockerMode;
  soundtrackMode: FocusSoundtrackMode;
  nextEventLabel?: string;
  minutesUntilEvent?: number | null;
  sessionFocusTaskId?: string | null;
}

export interface RankFocusDashboardCardsInput {
  timerRunning: boolean;
  hasUpcomingEvent: boolean;
  hasTopTasks: boolean;
  hasReflection: boolean;
}

export const deriveFocusPrimaryAction = ({
  timerRunning,
  timerStage,
  topTasksCount,
  activeFocusTaskId,
  activeFocusTaskLabel,
  sessionFocusTaskId,
  minutesUntilEvent,
}: DeriveFocusPrimaryActionInput): FocusPrimaryAction => {
  const activeTaskId = activeFocusTaskId?.trim();
  const focusLabel = activeFocusTaskLabel?.trim();
  const sessionTaskId = sessionFocusTaskId?.trim();

  if (
    timerRunning &&
    timerStage === TimerStage.Focus &&
    activeTaskId &&
    sessionTaskId &&
    activeTaskId !== sessionTaskId
  ) {
    return {
      kind: "switch-focus-task",
      label: focusLabel ? `Switch Focus: ${focusLabel}` : "Switch Focus Task",
      description: focusLabel
        ? `Switch this running focus block to ${focusLabel}.`
        : "Switch the running focus block to the selected task.",
      emphasis: "primary",
    };
  }

  if (timerRunning && timerStage === TimerStage.Focus) {
    return {
      kind: "resume-focus-session",
      label: focusLabel ? `Resume Focus: ${focusLabel}` : "Resume Focus Session",
      description: focusLabel
        ? `Jump back into the active block for ${focusLabel}.`
        : "Jump back into the active focus block.",
      emphasis: "primary",
    };
  }

  if (topTasksCount === 0) {
    return {
      kind: "review-plan",
      label: "Review Daily Plan",
      description: "Set the priorities that matter for today.",
      emphasis: "secondary",
    };
  }

  if (!focusLabel) {
    return {
      kind: "choose-focus-task",
      label: "Choose Focus Task",
      description: "Pick or pin the task you want to anchor the next focus block.",
      emphasis: "secondary",
    };
  }

  if (focusLabel && minutesUntilEvent !== null && minutesUntilEvent !== undefined && minutesUntilEvent > 0 && minutesUntilEvent < 30) {
    return {
      kind: "start-focus-session",
      label: `Use ${minutesUntilEvent} min for: ${focusLabel}`,
      description: "Start a shorter focus block before your next event.",
      emphasis: "primary",
    };
  }

  return {
    kind: "start-focus-session",
    label: focusLabel ? `Start Focus: ${focusLabel}` : "Start Focus Session",
    description: focusLabel
      ? `Launch a fresh focus block for ${focusLabel}.`
      : "Launch a fresh focus block with your focus tools.",
    emphasis: "primary",
  };
};

export const deriveFocusDashboardSnapshot = ({
  date,
  greeting,
  topTasks,
  timerRunning,
  timerStage,
  timerLabel,
  blockerMode,
  soundtrackMode,
  nextEventLabel,
  minutesUntilEvent,
  sessionFocusTaskId,
}: DeriveFocusDashboardSnapshotInput): FocusDashboardSnapshot => {
  const topTasksCompleted = topTasks.filter((task) => task.completed).length;
  const activeFocusTask =
    topTasks.find((task) => !task.completed && task.pinned) ?? null;
  const agendaWindowLabel =
    minutesUntilEvent === null || minutesUntilEvent === undefined
      ? "Calendar is clear for deep work."
      : minutesUntilEvent <= 0
        ? "An event is happening now."
        : minutesUntilEvent < 30
          ? `${minutesUntilEvent} min until your next event. Keep this focus block short.`
          : `${minutesUntilEvent} min available before your next event.`;

  return {
    date,
    greeting,
    headline:
      topTasks.length > 0 ? "Your day is ready" : "Shape your day with intention",
    focusPlan: {
      date,
      headline:
      activeFocusTask?.title ?? "Choose the one thing that deserves your focus",
      intention: "",
      topTasks,
      sessionTarget: 0,
      reflection: "",
    },
    activeFocusTaskId: activeFocusTask?.id ?? null,
    activeFocusTaskLabel:
      activeFocusTask?.title ?? "Choose a task to anchor the next focus block",
    sessionFocusTaskId: sessionFocusTaskId ?? activeFocusTask?.id ?? null,
    topTasksCompleted,
    topTasksTotal: topTasks.length,
    currentTimerLabel: timerLabel,
    currentTimerRunning: timerRunning,
    blockerMode,
    soundtrackMode,
    nextEventLabel:
      nextEventLabel && nextEventLabel.trim().length > 0
        ? nextEventLabel
        : "No events scheduled",
    agendaWindowLabel,
    primaryAction: deriveFocusPrimaryAction({
      timerRunning,
      timerStage,
      topTasksCount: topTasks.length,
      activeFocusTaskId: activeFocusTask?.id,
      activeFocusTaskLabel: activeFocusTask?.title,
      sessionFocusTaskId,
      minutesUntilEvent,
    }),
  };
};

export const rankFocusDashboardCards = ({
  timerRunning,
  hasUpcomingEvent,
  hasTopTasks,
  hasReflection,
}: RankFocusDashboardCardsInput): FocusDashboardCardId[] => {
  const ordered: FocusDashboardCardId[] = [];

  if (timerRunning) {
    ordered.push("focus-session");
  }

  if (hasTopTasks) {
    ordered.push("daily-plan");
  }

  if (hasUpcomingEvent) {
    ordered.push("agenda");
  }

  if (hasReflection) {
    ordered.push("reflection");
  }

  for (const fallback of [
    "focus-session",
    "daily-plan",
    "agenda",
    "reflection",
  ] satisfies FocusDashboardCardId[]) {
    if (!ordered.includes(fallback)) {
      ordered.push(fallback);
    }
  }

  return ordered;
};
