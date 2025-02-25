import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  index,
  customType,
} from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export enum MantraType {
  CUSTOM = "custom",
  GLOBAL = "global",
}

const EnumMantraType = customType<{
  data: MantraType;
}>({
  dataType: () => "text",
});

export const mantras = pgTable(
  "mantras",
  {
    id,
    userId: text("user_id").notNull(),
    text: text("text").notNull(),
    type: EnumMantraType("type").notNull(),
    date: timestamp("date", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_mantras_user_id").on(table.userId),
    typeIdx: index("idx_mantras_type").on(table.type),
    dateIdx: index("idx_mantras_date").on(table.date),
  })
);

export type Mantra = typeof mantras.$inferSelect;
export type MantraInsert = typeof mantras.$inferInsert;

export const mantrasRelations = relations(mantras, ({ one }) => ({
  user: one(users, {
    fields: [mantras.userId],
    references: [users.id],
  }),
}));
