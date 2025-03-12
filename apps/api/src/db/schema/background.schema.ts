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
    type: EnumBackgroundType("type").notNull(),
    url: text("url").notNull(),
    metadata: jsonb("metadata").$type<BackgroundMetadata>(),
    schedule: jsonb("schedule"),
    createdAt,
    updatedAt,
  },
  (table) => ({
    typeIdx: index("idx_backgrounds_type").on(table.type),
  })
);

export const userBackgroundViews = pgTable(
  "user_background_views",
  {
    id,
    userId: text("user_id").notNull(),
    backgroundId: text("background_id").notNull(),
    isFavourite: boolean("is_favourite").default(false),
    createdAt,
    updatedAt,
  },
  (table) => ({
    userIdIdx: index("idx_user_bg_views_user_id").on(table.userId),
    backgroundIdIdx: index("idx_user_bg_views_bg_id").on(table.backgroundId),
    uniqueIdx: index("idx_user_bg_views_unique").on(
      table.userId,
      table.backgroundId
    ),
  })
);

export type Background = typeof backgrounds.$inferSelect;
export type BackgroundInsert = typeof backgrounds.$inferInsert;

export type UserBackgroundView = typeof userBackgroundViews.$inferSelect;
export type UserBackgroundViewInsert = typeof userBackgroundViews.$inferInsert;

export const backgroundsRelations = relations(backgrounds, ({ many }) => ({
  userViews: many(userBackgroundViews),
}));

export const userBackgroundViewsRelations = relations(
  userBackgroundViews,
  ({ one }) => ({
    user: one(users, {
      fields: [userBackgroundViews.userId],
      references: [users.id],
    }),
    background: one(backgrounds, {
      fields: [userBackgroundViews.backgroundId],
      references: [backgrounds.id],
    }),
  })
);
