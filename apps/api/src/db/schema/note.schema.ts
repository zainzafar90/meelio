import { relations } from "drizzle-orm";
import { pgTable, text, index } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export const notes = pgTable(
  "notes",
  {
    id,
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    content: text("content"),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_notes_user_id").on(table.userId),
    titleIdx: index("idx_notes_title").on(table.title),
  })
);

export type Note = typeof notes.$inferSelect;
export type NoteInsert = typeof notes.$inferInsert;

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));
