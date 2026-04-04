export interface DailyFocusTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface DailyFocusPlan {
  date: string;
  headline: string;
  intention: string;
  topTasks: DailyFocusTask[];
  sessionTarget: number;
  reflection: string;
}

export type FocusPrimaryActionKind =
  | "start-focus-session"
  | "resume-focus-session"
  | "review-plan";

export type FocusActionEmphasis = "primary" | "secondary";

export interface FocusPrimaryAction {
  kind: FocusPrimaryActionKind;
  label: string;
  description: string;
  emphasis: FocusActionEmphasis;
}

export type FocusBlockerMode = "ready" | "active" | "bypassing";
export type FocusSoundtrackMode = "available" | "playing" | "muted";

export interface FocusDashboardSnapshot {
  date: string;
  greeting: string;
  headline: string;
  focusPlan: DailyFocusPlan;
  topTasksCompleted: number;
  topTasksTotal: number;
  currentTimerLabel: string;
  currentTimerRunning: boolean;
  blockerMode: FocusBlockerMode;
  soundtrackMode: FocusSoundtrackMode;
  nextEventLabel: string;
  primaryAction: FocusPrimaryAction;
}
