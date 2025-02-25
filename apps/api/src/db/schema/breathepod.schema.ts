import { relations } from "drizzle-orm";
import { pgTable, text, jsonb, index } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export const breathepod = pgTable(
  "breathepod",
  {
    id,
    userId: text("user_id")
      .notNull()
      .references(() => users.id)
      .unique(),
    config: jsonb("config"),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_breathepod_user_id").on(table.userId),
  })
);

export type Breathepod = typeof breathepod.$inferSelect;
export type BreathepodInsert = typeof breathepod.$inferInsert;

export const breathepodRelations = relations(breathepod, ({ one }) => ({
  user: one(users, {
    fields: [breathepod.userId],
    references: [users.id],
  }),
}));
