import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  customType,
} from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}

const EnumTaskStatus = customType<{
  data: TaskStatus;
}>({
  dataType: () => "text",
});

export const tasks = pgTable(
  "tasks",
  {
    id,
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category"),
    isFocus: boolean("is_focus").default(false),
    status: EnumTaskStatus("status").notNull().default(TaskStatus.PENDING),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_tasks_user_id").on(table.userId),
    categoryIdx: index("idx_tasks_category").on(table.category),
    statusIdx: index("idx_tasks_status").on(table.status),
    isFocusIdx: index("idx_tasks_is_focus").on(table.isFocus),
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
