import {
  pgTable,
  text,
  timestamp,
  boolean,
  customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { users } from "./user.schema";
import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { Provider } from "@/types/enums.types";

const EnumProvider = customType<{
  data: Provider;
}>({
  dataType: () => "text",
});

export const accounts = pgTable("accounts", {
  id,
  userId: text("user_id").notNull(),
  provider: EnumProvider("provider").notNull(),
  providerAccountId: text("provider_account_id"),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  accessTokenExpires: timestamp("access_token_expires"),
  refreshTokenExpires: timestamp("refresh_token_expires"),
  idToken: text("id_token"),
  scope: text("scope"),
  blacklisted: boolean("blacklisted").notNull().default(false),
  createdAt,
  updatedAt,
});

export type Account = typeof accounts.$inferSelect;
export type AccountInsert = typeof accounts.$inferInsert;

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
