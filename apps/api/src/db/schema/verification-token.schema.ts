import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  customType,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./user.schema";
import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { VerificationTokenType } from "@/types/enums.types";

// export const verificationTokenTypes = [
//   "resetPassword",
//   "verifyEmail",
//   "magicLink",
//   "invite",
// ] as const;
// export type VerificationTokenType = (typeof verificationTokenTypes)[number];
// const verificationTokenTypeEnum = pgEnum(
//   "verification_token_type",
//   verificationTokenTypes
// );

const EnumVerificationTokenType = customType<{
  data: VerificationTokenType;
}>({
  dataType: () => "text",
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id,
    email: varchar("email", { length: 255 }).notNull(),
    token: text("token").notNull(),
    type: EnumVerificationTokenType("type").notNull(),
    expiresAt: timestamp("expires_at"),
    blacklisted: boolean("blacklisted").notNull().default(false),
    createdAt,
    updatedAt,
  },
  (table) => ({
    tokenTypeIdx: index("idx_tokens_token_type").on(table.token, table.type),
    emailIdx: index("idx_tokens_email").on(table.email),
  })
);

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type VerificationTokenInsert = typeof verificationTokens.$inferInsert;

export const verificationTokensRelations = relations(
  verificationTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [verificationTokens.email],
      references: [users.email],
    }),
  })
);
