import { relations } from "drizzle-orm";
import { pgTable, text, index, timestamp } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export const calendarTokens = pgTable(
  "calendar_tokens",
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
    userIdx: index("idx_calendar_tokens_user_id").on(table.userId),
  }),
);

export type CalendarToken = typeof calendarTokens.$inferSelect;
export type CalendarTokenInsert = typeof calendarTokens.$inferInsert;

export const calendarTokensRelations = relations(calendarTokens, ({ one }) => ({
  user: one(users, {
    fields: [calendarTokens.userId],
    references: [users.id],
  }),
}));
