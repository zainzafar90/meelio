import { logger } from "@repo/logger";
import { subscriptionService } from "../subscription/subscription.service";
import { userService } from "../user";
import { WebhookObject, WebhookEvent, RoleType } from "@/types";
import { billingWebhookService } from "../webhooks/billing-webhook.service";

export const billingService = {
  processEvent: async (event: WebhookObject, webhookEventId: string | null) => {
    try {
      if (event.data.type === "subscriptions") {
        if (
          event.meta.event_name === WebhookEvent.SubscriptionCreated ||
          event.meta.event_name === WebhookEvent.SubscriptionUpdated
        ) {
          const email = event.data.attributes.user_email;
          const user = await userService.getUserByEmail(email);
          if (!user) {
            logger.log(
              `[Creating] User: ${email} as user with ${RoleType.User} role, for subscription ${event.data.id} needs to be created`
            );
            await userService.createUser({
              email,
              name: email,
              role: RoleType.User,
            });
          }

          let processingError = "";
          try {
            await subscriptionService.addOrUpdateSubscription(
              event.data,
              user?.id
            );
          } catch (error) {
            if (error instanceof Error) {
              processingError = error.message;
            } else {
              processingError = "An unknown error occurred";
            }
          }

          if (webhookEventId) {
            billingWebhookService.updateWebhookEvent(
              event,
              processingError,
              webhookEventId
            );
          }
        }
      }

      return true;
    } catch (error) {
      logger.error(error);
      return false;
    }
  },
};
