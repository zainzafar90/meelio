import { ISubscription, SubscriptionObject } from "@/types";
import { db } from "@/db";
import {
  subscriptions,
  SubscriptionInsert,
} from "@/db/schema/subscription.schema";
import { eq, or, and, desc } from "drizzle-orm";

const addOrUpdateSubscription = async (
  subscriptionObj: SubscriptionObject,
  userId: string | null
) => {
  const existingSubscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.lemonSqueezyId, subscriptionObj.id),
  });

  if (existingSubscription) {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({
        lemonSqueezyId: String(subscriptionObj.id),
        subscriptionItemId: String(
          subscriptionObj.attributes.first_subscription_item.id
        ),
        orderId: String(subscriptionObj.attributes.order_id),
        name: subscriptionObj.attributes.user_name,
        email: subscriptionObj.attributes.user_email,
        status: subscriptionObj.attributes.status,
        priceId: String(
          subscriptionObj.attributes.first_subscription_item.price_id
        ),
        planId: "0",
        renewsAt: subscriptionObj.attributes.renews_at
          ? new Date(subscriptionObj.attributes.renews_at)
          : null,
        endsAt: subscriptionObj.attributes.ends_at
          ? new Date(subscriptionObj.attributes.ends_at)
          : null,
        trialEndsAt: subscriptionObj.attributes.trial_ends_at
          ? new Date(subscriptionObj.attributes.trial_ends_at)
          : null,
        cancelled: subscriptionObj.attributes.cancelled,
        productName: subscriptionObj.attributes.product_name,
        updatePaymentUrl: subscriptionObj.attributes.urls.update_payment_method,
        customerPortalUrl: subscriptionObj.attributes.urls.customer_portal,
        userId: userId || existingSubscription.userId,
        isUsageBased: false,
      } as SubscriptionInsert)
      .where(eq(subscriptions.id, existingSubscription.id))
      .returning();

    return updatedSubscription;
  } else {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        lemonSqueezyId: String(subscriptionObj.id),
        subscriptionItemId: String(
          subscriptionObj.attributes.first_subscription_item.id
        ),
        orderId: String(subscriptionObj.attributes.order_id),
        name: subscriptionObj.attributes.user_name,
        email: subscriptionObj.attributes.user_email,
        status: subscriptionObj.attributes.status,
        priceId: String(
          subscriptionObj.attributes.first_subscription_item.price_id
        ),
        planId: "0",
        renewsAt: subscriptionObj.attributes.renews_at
          ? new Date(subscriptionObj.attributes.renews_at)
          : null,
        endsAt: subscriptionObj.attributes.ends_at
          ? new Date(subscriptionObj.attributes.ends_at)
          : null,
        trialEndsAt: subscriptionObj.attributes.trial_ends_at
          ? new Date(subscriptionObj.attributes.trial_ends_at)
          : null,
        cancelled: subscriptionObj.attributes.cancelled,
        productName: subscriptionObj.attributes.product_name,
        updatePaymentUrl: subscriptionObj.attributes.urls.update_payment_method,
        customerPortalUrl: subscriptionObj.attributes.urls.customer_portal,
        userId: userId || existingSubscription.userId,
        isUsageBased: false,
      } as SubscriptionInsert)
      .returning();

    return newSubscription;
  }
};

/**
 * Get subscription by id
 * @param {string} id
 */
const getSubscriptionById = async (id: string) => {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, id),
  });

  return subscription as ISubscription;
};

const getSubscriptionByEmail = async (email: string) => {
  const baseConditions = [
    eq(subscriptions.email, email),
    or(
      eq(subscriptions.status, 'active'),
      eq(subscriptions.status, 'on_trial'),
      eq(subscriptions.status, 'past_due'),
      eq(subscriptions.status, 'paused'),
      eq(subscriptions.status, 'cancelled'),
    ),
  ];

  const subscription = await db.query.subscriptions.findFirst({
    where: and(...baseConditions),
    orderBy: desc(subscriptions.createdAt),
  });

  const hasActiveSubscription =
    subscription.status === "active" ||
    subscription.status === "on_trial" ||
    subscription.status === "past_due" ||
    subscription.status === "paused" ||
    (subscription.status === "cancelled" &&
      subscription.endsAt &&
      subscription.endsAt > new Date());

  if (!hasActiveSubscription) {
    return null;
  }

  return subscription as ISubscription;
};

export const subscriptionService = {
  addOrUpdateSubscription,
  getSubscriptionById,
  getSubscriptionByEmail,
};
