import { relations } from "drizzle-orm";
import { pgTable, text, index, uuid, timestamp, boolean } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt, deletedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";
import { categories } from "./category.schema";
import { providers } from "./provider.schema";

export const notes = pgTable(
  "notes",
  {
    id,
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    pinned: boolean("pinned").notNull().default(false),
    categoryId: uuid("category_id"),
    providerId: uuid("provider_id"),
    createdAt,
    updatedAt,
    deletedAt,
  },
  (table) => ({
    userIdIdx: index("idx_notes_user_id").on(table.userId),
    titleIdx: index("idx_notes_title").on(table.title),
    categoryIdIdx: index("idx_notes_category_id").on(table.categoryId),
    providerIdIdx: index("idx_notes_provider_id").on(table.providerId),
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
