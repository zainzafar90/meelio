import { relations } from "drizzle-orm";
import { pgTable, text, index, boolean } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export const siteBlockers = pgTable(
  "site_blockers",
  {
    id,
    userId: text("user_id").notNull(),
    category: text("category"),
    url: text("url").notNull(),
    isBlocked: boolean("is_blocked").notNull().default(true),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_site_blockers_user_id").on(table.userId),
    categoryIdx: index("idx_site_blockers_category").on(table.category),
    urlIdx: index("idx_site_blockers_url").on(table.url),
  })
);

export type SiteBlocker = typeof siteBlockers.$inferSelect;
export type SiteBlockerInsert = typeof siteBlockers.$inferInsert;

export const siteBlockersRelations = relations(siteBlockers, ({ one }) => ({
  user: one(users, {
    fields: [siteBlockers.userId],
    references: [users.id],
  }),
}));
