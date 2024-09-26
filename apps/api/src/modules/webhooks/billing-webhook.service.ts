import { logger } from "@repo/logger";

import { WebhookObject } from "./billing-webhook.interface";
import BillingWebhook from "./billing-webhook.model";

export const billingWebhookService = {
  createWebhookEvent: async (event: WebhookObject) => {
    logger.log(`[Creating] Billing Webhook Event: ${event.meta.event_name}`);

    const billingWebhook = await BillingWebhook.create({
      eventName: event.meta.event_name,
      eventBody: event,
    });

    return billingWebhook;
  },
  updateWebhookEvent: async (
    event: WebhookObject,
    processingError: string,
    id: string
  ) => {
    logger.log(`[Updating] Billing Webhook Event: ${event.meta.event_name}`);

    const billingWebhook = await BillingWebhook.findByIdAndUpdate(id, {
      processingError,
      processed: true,
    });

    return billingWebhook;
  },
};
