import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";

// Create enum for category names matching the shared Category enum
export const categoryEnum = pgEnum("category_name", [
  "Productivity",
  "Relax",
  "NoiseBlocker",
  "CreativeThinking",
  "BeautifulAmbients",
  "Random",
  "Motivation",
  "Sleep",
  "Studying",
  "Writing",
]);

export const categories = pgTable(
  "categories",
  {
    id,
    name: categoryEnum("name").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => ({
    nameIdx: index("idx_categories_name").on(table.name),
  })
);

export type Category = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;

// Define relations if needed in the future
export const categoriesRelations = relations(categories, ({}) => ({}));