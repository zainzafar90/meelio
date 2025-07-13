import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  customType,
  index,
} from "drizzle-orm/pg-core";

import { Provider } from "@/types/enums.types";
import { users } from "./user.schema";
import { createdAt, id, updatedAt } from "./helpers/date-helpers";

const EnumProvider = customType<{ data: Provider }>({
  dataType: () => "text",
});

export const sessions = pgTable("sessions", {
  id,
  userId: text("user_id").notNull(),
  provider: EnumProvider("provider").notNull(),
  accessToken: text("access_token").notNull(),
  accessTokenExpires: timestamp("access_token_expires"),
  refreshToken: text("refresh_token"),
  refreshTokenExpires: timestamp("refresh_token_expires"),
  deviceInfo: text("device_info"),
  blacklisted: boolean("blacklisted").notNull().default(false),
  createdAt,
  updatedAt,
}, (table) => ({
  tokenIndex: index("idx_sessions_token").on(table.accessToken),
  userBlacklistedIndex: index("idx_sessions_user_blacklisted").on(table.userId, table.blacklisted),
  expirationIndex: index("idx_sessions_expiration").on(table.accessTokenExpires, table.refreshTokenExpires),
}));

export type SessionTable = typeof sessions.$inferSelect;
export type SessionInsertTable = typeof sessions.$inferInsert;

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
