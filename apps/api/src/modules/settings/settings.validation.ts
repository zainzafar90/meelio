import { z } from "zod";

export const pomodoroSettingsSchema = z.object({
  workDuration: z.number().min(1).max(60).default(25),
  breakDuration: z.number().min(1).max(30).default(5),
  autoStart: z.boolean().default(false),
  autoBlock: z.boolean().default(false),
  soundOn: z.boolean().default(true),
  notificationSoundId: z.string().optional(),
  notificationEnabled: z.boolean().default(false),
  notificationSoundEnabled: z.boolean().default(false),
  dailyFocusLimit: z.number().min(0).max(1440).default(120),
});

export const userSettingsSchema = z.object({
  pomodoro: pomodoroSettingsSchema.optional(),
  onboardingCompleted: z.boolean().optional(),
  task: z.object({ confettiOnComplete: z.boolean() }).optional(),
});

export const updateSettingsSchema = z.object({
  body: userSettingsSchema.partial(),
});

export type PomodoroSettings = z.infer<typeof pomodoroSettingsSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
