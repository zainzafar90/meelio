import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uuid,
} from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";
import { categories } from "./category.schema";
import { providers } from "./provider.schema";

export const tasks = pgTable(
  "tasks",
  {
    id,
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    completed: boolean("completed").notNull().default(false),
    pinned: boolean("pinned").notNull().default(false),
    dueDate: timestamp("due_date", { withTimezone: true }),
    categoryId: uuid("category_id"),
    providerId: uuid("provider_id"),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_tasks_user_id").on(table.userId),
    completedIdx: index("idx_tasks_completed").on(table.completed),
    pinnedIdx: index("idx_tasks_pinned").on(table.pinned),
    dueDateIdx: index("idx_tasks_due_date").on(table.dueDate),
    categoryIdIdx: index("idx_tasks_category_id").on(table.categoryId),
    providerIdIdx: index("idx_tasks_provider_id").on(table.providerId),
  })
);

export type Task = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [tasks.categoryId],
    references: [categories.id],
  }),
  provider: one(providers, {
    fields: [tasks.providerId],
    references: [providers.id],
  }),
}));