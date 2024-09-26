import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth/auth.middleware';
import { subscriptionController } from '../../modules/subscription/subscription.controller';
import { subscriptionValidation } from '../../modules/subscription/subscription.validator';

const router: Router = express.Router();

router.get('/checkout', auth(), subscriptionController.getCheckout);

router.get(
  '/:subscriptionId',
  auth(),
  validate(subscriptionValidation.getSubscription),
  subscriptionController.getSubscription
);

router.get(
  '/:subscriptionId/portal',
  auth(),
  validate(subscriptionValidation.getSubscription),
  subscriptionController.getLemonSqueezyPortalUrl
);

export default router;
