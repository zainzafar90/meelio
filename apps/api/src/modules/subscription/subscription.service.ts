import mongoose from 'mongoose';
import { SubscriptionObject } from '../webhooks/billing-webhook.interface';
import { ISubscriptionDoc } from './subscription.interface';
import Subscription from './subscription.model';

const addOrUpdateSubscription = async (subscriptionObj: SubscriptionObject, userId: string | null) => {
  const subscription = await Subscription.findOneAndUpdate(
    {
      lemonSqueezyId: parseInt(subscriptionObj.id, 10),
    },
    {
      orderId: subscriptionObj.attributes.order_id,
      name: subscriptionObj.attributes.user_name,
      email: subscriptionObj.attributes.user_email,
      status: subscriptionObj.attributes.status,
      renewsAt: subscriptionObj.attributes.renews_at,
      endsAt: subscriptionObj.attributes.ends_at,
      trialEndsAt: subscriptionObj.attributes.trial_ends_at,
      priceId: subscriptionObj.attributes.first_subscription_item.price_id,
      subscriptionItemId: subscriptionObj.attributes.first_subscription_item.id,
      cancelled: subscriptionObj.attributes.cancelled,
      productName: subscriptionObj.attributes.product_name,
      updatePaymentUrl: subscriptionObj.attributes.urls.update_payment_method,
      customerPortalUrl: subscriptionObj.attributes.urls.customer_portal,
      planId: 0,
      userId,
      isUsageBased: false,
    },
    {
      upsert: true,
      new: true,
    }
  );

  return subscription;
};

/**
 * Get subscription by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<ISubscriptionDoc | null>}
 */
const getSubscriptionById = async (id: mongoose.Types.ObjectId): Promise<ISubscriptionDoc | null> =>
  Subscription.findById(id);

export const subscriptionService = {
  addOrUpdateSubscription,
  getSubscriptionById,
};
