import { boolean, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers/date-helpers";

export const billingWebhooks = pgTable("billing_webhooks", {
  id,
  eventName: text("event_name").notNull(),
  processed: boolean("processed").notNull().default(false),
  eventBody: jsonb("event_body").notNull(),
  processingError: text("processing_error"),
  createdAt,
  updatedAt,
});
