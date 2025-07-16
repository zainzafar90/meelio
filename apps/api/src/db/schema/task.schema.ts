import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export const tasks = pgTable(
  "tasks",
  {
    id,
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    completed: boolean("completed").notNull().default(false),
    pinned: boolean("pinned").notNull().default(false),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_tasks_user_id").on(table.userId),
    completedIdx: index("idx_tasks_completed").on(table.completed),
    pinnedIdx: index("idx_tasks_pinned").on(table.pinned),
    dueDateIdx: index("idx_tasks_due_date").on(table.dueDate),
  })
);

export type Task = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));