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
}: DeriveFocusPrimaryActionInput): FocusPrimaryAction => {
  if (timerRunning && timerStage === TimerStage.Focus) {
    return {
      kind: "resume-focus-session",
      label: "Resume Focus Session",
      description: "Jump back into the active focus block.",
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

  return {
    kind: "start-focus-session",
    label: "Start Focus Session",
    description: "Launch a fresh focus block with your focus tools.",
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
}: DeriveFocusDashboardSnapshotInput): FocusDashboardSnapshot => {
  const topTasksCompleted = topTasks.filter((task) => task.completed).length;

  return {
    date,
    greeting,
    headline:
      topTasks.length > 0 ? "Your day is ready" : "Shape your day with intention",
    focusPlan: {
      date,
      headline:
        topTasks[0]?.title ?? "Choose the one thing that deserves your focus",
      intention: "",
      topTasks,
      sessionTarget: 0,
      reflection: "",
    },
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
    primaryAction: deriveFocusPrimaryAction({
      timerRunning,
      timerStage,
      topTasksCount: topTasks.length,
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
