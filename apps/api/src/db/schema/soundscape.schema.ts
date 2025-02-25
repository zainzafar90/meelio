import { relations } from "drizzle-orm";
import { pgTable, text, jsonb, boolean, index } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export const soundscapes = pgTable(
  "soundscapes",
  {
    id,
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    config: jsonb("config"),
    shareable: boolean("shareable").default(false),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_soundscapes_user_id").on(table.userId),
    nameIdx: index("idx_soundscapes_name").on(table.name),
    shareableIdx: index("idx_soundscapes_shareable").on(table.shareable),
  })
);

export type Soundscape = typeof soundscapes.$inferSelect;
export type SoundscapeInsert = typeof soundscapes.$inferInsert;

export const soundscapesRelations = relations(soundscapes, ({ one }) => ({
  user: one(users, {
    fields: [soundscapes.userId],
    references: [users.id],
  }),
}));
