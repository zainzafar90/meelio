import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export const calendarTokens = pgTable("calendar_tokens", {
  id,
  userId: text("user_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt,
  updatedAt,
});

export type CalendarToken = typeof calendarTokens.$inferSelect;
export type CalendarTokenInsert = typeof calendarTokens.$inferInsert;

export const calendarTokensRelations = relations(calendarTokens, ({ one }) => ({
  user: one(users, {
    fields: [calendarTokens.userId],
    references: [users.id],
  }),
}));
