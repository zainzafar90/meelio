import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export const focusSessions = pgTable(
  "focus_sessions",
  {
    id,
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    sessionStart: timestamp("session_start", { withTimezone: true }).notNull(),
    sessionEnd: timestamp("session_end", { withTimezone: true }).notNull(),
    duration: integer("duration").notNull(), // duration in minutes
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_focus_sessions_user_id").on(table.userId),
    sessionStartIdx: index("idx_focus_sessions_start").on(table.sessionStart),
    sessionEndIdx: index("idx_focus_sessions_end").on(table.sessionEnd),
  })
);

export type FocusSession = typeof focusSessions.$inferSelect;
export type FocusSessionInsert = typeof focusSessions.$inferInsert;

export const focusSessionsRelations = relations(focusSessions, ({ one }) => ({
  user: one(users, {
    fields: [focusSessions.userId],
    references: [users.id],
  }),
}));
