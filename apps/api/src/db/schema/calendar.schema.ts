import { relations } from "drizzle-orm";
import { pgTable, text, index, timestamp } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export const calendar = pgTable(
  "calendar",
  {
    id,
    userId: text("user_id").notNull().unique(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdx: index("idx_calendar_user_id").on(table.userId),
  })
);

export type Calendar = typeof calendar.$inferSelect;
export type CalendarInsert = typeof calendar.$inferInsert;

export const calendarRelations = relations(calendar, ({ one }) => ({
  user: one(users, {
    fields: [calendar.userId],
    references: [users.id],
  }),
}));
