import { LemonsqueezyClient } from "lemonsqueezy.ts";
import httpStatus from "http-status";

import { ApiError } from "@/common/errors";
import { config } from "@/config/config";
import { logger } from "@repo/logger";

const lemonSqueezyClient = new LemonsqueezyClient(config.billing.apiKey);

const retrieveSubscription = async (lemonSqueezySubscriptionId: string) => {
  const lsSubscription = await lemonSqueezyClient.retrieveSubscription({
    id: lemonSqueezySubscriptionId,
  });
  if (!lsSubscription) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Lemon Squeezy subscription not found"
    );
  }

  return (lsSubscription.data.attributes.urls as any).customer_portal;
};

const createCheckout = async (
  variantId: string,
  userId: string,
  userEmail: string,
  userName: string
): Promise<string | null> => {
  try {
    const checkout = await lemonSqueezyClient.createCheckout({
      store: config.billing.storeId,
      variant: variantId,
      checkout_data: {
        email: userEmail,
        name: userName || userEmail,
        custom: [userId],
        billing_address: {
          country: "US",
          zip: "82601",
        },
      },
      checkout_options: {
        embed: true,
        media: false,
        dark: true,
      },
      custom_price: 0,
    });

    if (!checkout) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Lemon Squeezy checkout failed"
      );
    }

    return checkout.data.attributes.url;
  } catch (error) {
    logger.error(error);
    throw new ApiError(httpStatus.NOT_FOUND, "Lemon Squeezy checkout failed");
  }
};

export const lemonSqueezyService = {
  retrieveSubscription,
  createCheckout,
};
