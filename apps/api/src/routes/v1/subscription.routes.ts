import express, { Router } from "express";

import auth from "@/modules/auth/auth.middleware";

import { subscriptionController } from "@/modules/subscription/subscription.controller";
import { subscriptionValidation } from "@/modules/subscription/subscription.validator";
import { validate } from "@/common/validate";

const router: Router = express.Router();

router.get("/checkout", auth(), subscriptionController.getCheckout);

router.get(
  "/:subscriptionId",
  auth(),
  validate(subscriptionValidation.getSubscription),
  subscriptionController.getSubscription
);

router.get(
  "/:subscriptionId/portal",
  auth(),
  validate(subscriptionValidation.getSubscription),
  subscriptionController.getLemonSqueezyPortalUrl
);

export default router;
