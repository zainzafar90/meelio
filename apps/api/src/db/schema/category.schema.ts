import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  index,
  unique,
} from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";
import { tasks } from "./task.schema";

export const categories = pgTable(
  "task_categories",
  {
    id,
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_categories_user_id").on(table.userId),
    uniqueUserCategory: unique("unique_user_category").on(table.userId, table.name),
  })
);

export type Category = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));