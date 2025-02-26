import { Request, Response } from "express";
import httpStatus from "http-status";

import { billingService } from "./billing.service";
import { billingWebhookService } from "@/modules/webhooks/billing-webhook.service";
import { WebhookObject } from "@/types";
import { catchAsync } from "@/utils/catch-async";

export const billingController = {
  webhook: catchAsync(async (req: Request, res: Response) => {
    const lemonSqueezyEvent = req.body as WebhookObject;
    const webhookEvent =
      await billingWebhookService.createWebhookEvent(lemonSqueezyEvent);

    const eventProcessed = await billingService.processEvent(
      lemonSqueezyEvent,
      webhookEvent?.id
    );

    if (!eventProcessed) {
      return res.status(httpStatus.BAD_REQUEST).send({
        success: false,
        message: "Event not processed",
      });
    }

    return res.status(httpStatus.OK).send({
      success: true,
    });
  }),
};
