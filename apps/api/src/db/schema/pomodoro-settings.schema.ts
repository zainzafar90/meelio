import { relations } from "drizzle-orm";
import { pgTable, text, integer, boolean, index } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export const pomodoroSettings = pgTable(
  "pomodoro_settings",
  {
    id,
    userId: text("user_id").notNull(),
    workDuration: integer("work_duration").notNull().default(25),
    breakDuration: integer("break_duration").notNull().default(5),
    autoStart: boolean("auto_start").default(false),
    autoBlock: boolean("auto_block").default(false),
    soundOn: boolean("sound_on").default(true),
    dailyFocusLimit: integer("daily_focus_limit").default(120),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_pomodoro_settings_user_id").on(table.userId),
  })
);

export type PomodoroSetting = typeof pomodoroSettings.$inferSelect;
export type PomodoroSettingInsert = typeof pomodoroSettings.$inferInsert;

export const pomodoroSettingsRelations = relations(
  pomodoroSettings,
  ({ one }) => ({
    user: one(users, {
      fields: [pomodoroSettings.userId],
      references: [users.id],
    }),
  })
);
