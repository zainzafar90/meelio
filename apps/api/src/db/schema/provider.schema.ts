import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  boolean,
  json,
  index,
} from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";

export const providers = pgTable(
  "providers",
  {
    id,
    name: text("name").notNull().unique(), // e.g., "google", "facebook", "github"
    displayName: text("display_name").notNull(), // e.g., "Google", "Facebook", "GitHub"
    enabled: boolean("enabled").notNull().default(true),
    clientId: text("client_id"),
    clientSecret: text("client_secret"), // Should be encrypted in production
    scopes: json("scopes").$type<string[]>().default([]),
    authUrl: text("auth_url"),
    tokenUrl: text("token_url"),
    userInfoUrl: text("user_info_url"),
    createdAt,
    updatedAt,
  },
  (table) => ({
    nameIdx: index("idx_providers_name").on(table.name),
    enabledIdx: index("idx_providers_enabled").on(table.enabled),
  })
);

export type Provider = typeof providers.$inferSelect;
export type ProviderInsert = typeof providers.$inferInsert;

// Define relations if needed in the future
export const providersRelations = relations(providers, ({}) => ({}));