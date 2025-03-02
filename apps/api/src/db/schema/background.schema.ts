import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  jsonb,
  index,
  customType,
  boolean,
} from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { users } from "./user.schema";

export enum BackgroundType {
  STATIC = "static",
  LIVE = "live",
}

export interface BackgroundMetadata {
  name: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
}

const EnumBackgroundType = customType<{
  data: BackgroundType;
}>({
  dataType: () => "text",
});

export const backgrounds = pgTable(
  "backgrounds",
  {
    id,
    userId: text("user_id").notNull(),
    type: EnumBackgroundType("type").notNull(),
    url: text("url").notNull(),
    metadata: jsonb("metadata").$type<BackgroundMetadata>(),
    schedule: jsonb("schedule"),
    isSelected: boolean("is_selected").default(false),
    defaultBackgroundId: text("default_background_id"),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_backgrounds_user_id").on(table.userId),
    typeIdx: index("idx_backgrounds_type").on(table.type),
  })
);

export type Background = typeof backgrounds.$inferSelect;
export type BackgroundInsert = typeof backgrounds.$inferInsert;

export const backgroundsRelations = relations(backgrounds, ({ one }) => ({
  user: one(users, {
    fields: [backgrounds.userId],
    references: [users.id],
  }),
}));
