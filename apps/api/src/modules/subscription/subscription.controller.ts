import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import { subscriptionService } from './subscription.service';

import { cookieService } from '../cookies';
import { accountService } from '../account/account.service';
import { lemonSqueezyService } from '../lemon-squeezy/lemon-squeezy.service';

const getSubscription = catchAsync(async (req: Request, res: Response) => {
  const subscription = await subscriptionService.getSubscriptionById(
    new mongoose.Types.ObjectId(req.params['subscriptionId'])
  );
  if (!subscription) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscription not found');
  }
  res.send(subscription);
});

const getLemonSqueezyPortalUrl = catchAsync(async (req: Request, res: Response) => {
  const subscription = await subscriptionService.getSubscriptionById(
    new mongoose.Types.ObjectId(req.params['subscriptionId'])
  );
  if (!subscription) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subscription not found');
  }

  const portalUrl = await lemonSqueezyService.retrieveSubscription(subscription.lemonSqueezyId?.toString());
  res.json({ url: portalUrl });
});

const getCheckout = catchAsync(async (req: Request, res: Response) => {
  const variantId = req.query['variantId'] as string;
  const apiToken = cookieService.getAuthCookieToken(req);
  const account = await accountService.getUserAccount(apiToken, true);
  if (!account) {
    return res.status(httpStatus.NOT_FOUND).send({
      message: 'User not found',
    });
  }

  if (!variantId) {
    return res.status(httpStatus.NOT_FOUND).send({
      message: 'Variant not found',
    });
  }

  const checkoutUrl = await lemonSqueezyService.createCheckout(
    variantId,
    account.userId,
    account.user.email,
    account.user.name
  );

  return res.json({ url: checkoutUrl });
});

export const subscriptionController = {
  getSubscription,
  getLemonSqueezyPortalUrl,
  getCheckout,
};
