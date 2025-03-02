import { relations } from "drizzle-orm";
import { pgTable, text, index } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export const tabStashes = pgTable(
  "tab_stashes",
  {
    id,
    userId: text("user_id").notNull(),
    windowId: text("window_id").notNull(),
    urls: text("urls").array().notNull(),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_tab_stashes_user_id").on(table.userId),
    windowIdIdx: index("idx_tab_stashes_window_id").on(table.windowId),
  })
);

export type TabStash = typeof tabStashes.$inferSelect;
export type TabStashInsert = typeof tabStashes.$inferInsert;

export const tabStashesRelations = relations(tabStashes, ({ one }) => ({
  user: one(users, {
    fields: [tabStashes.userId],
    references: [users.id],
  }),
}));
