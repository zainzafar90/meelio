import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  timestamp,
  varchar,
  customType,
  jsonb,
} from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./helpers/date-helpers";
import { verificationTokens } from "./verification-token.schema";
import { RoleType } from "@/types/enums.types";
import { IUserSettings } from "@/types/interfaces/resources";

export const DEFAULT_SETTINGS: IUserSettings = {
  pomodoro: {
    workDuration: 25,
    breakDuration: 5,
    autoStart: false,
    autoBlock: false,
    soundOn: true,
    dailyFocusLimit: 120,
  },
  onboardingCompleted: false,
  task: {
    confettiOnComplete: false,
  },
  calendar: {
    enabled: false,
  },
};

const EnumUserRole = customType<{
  data: RoleType;
}>({
  dataType: () => "text",
});

export const users = pgTable(
  "users",
  {
    id,
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).unique(),
    password: varchar("password", { length: 255 }),
    isEmailVerified: boolean("is_email_verified").default(false),
    image: varchar("image", { length: 255 }),
    role: EnumUserRole("role").notNull().default(RoleType.User),
    settings: jsonb("settings").default(DEFAULT_SETTINGS).notNull(),
    deletedAt: timestamp({ withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => ({
    nameIdx: index("idx_users_name").on(table.name),
    emailIdx: index("idx_users_email").on(table.email),
    roleIdx: index("idx_users_role").on(table.role),
  })
);

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

export const usersRelations = relations(users, ({ many }) => ({
  verificationTokens: many(verificationTokens),
}));
