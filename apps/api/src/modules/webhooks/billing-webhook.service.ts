import { logger } from "@repo/logger";

import { IBillingWebhook, WebhookObject } from "@/types";
import { billingWebhooks } from "@/db/schema/webhook.schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";

export const billingWebhookService = {
  createWebhookEvent: async (event: WebhookObject) => {
    logger.log(`[Creating] Billing Webhook Event: ${event.meta.event_name}`);

    const [billingWebhook] = await db
      .insert(billingWebhooks)
      .values({
        eventName: event.meta.event_name,
        eventBody: event,
      })
      .returning();

    return billingWebhook;
  },

  updateWebhookEvent: async (
    event: WebhookObject,
    processingError: string,
    id: string
  ) => {
    logger.log(`[Updating] Billing Webhook Event: ${event.meta.event_name}`);

    const billingWebhook = await db
      .update(billingWebhooks)
      .set({
        processingError,
        processed: true,
      } as IBillingWebhook)
      .where(eq(billingWebhooks.id, id));

    return billingWebhook;
  },
};
