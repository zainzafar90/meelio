import httpStatus from "http-status";
import axios from "axios";

import { ApiError } from "@/common/errors";
import { config } from "@/config/config";
import { logger } from "@repo/logger";
import { env } from "process";

const LEMON_SQUEEZY_API_URL = "https://api.lemonsqueezy.com/v1";

const axiosInstance = axios.create({
  baseURL: LEMON_SQUEEZY_API_URL,
  headers: {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    Authorization: `Bearer ${config.billing.apiKey}`,
  },
});

const retrieveSubscription = async (lemonSqueezySubscriptionId: string) => {
  try {
    const response = await axiosInstance.get(
      `/subscriptions/${lemonSqueezySubscriptionId}`
    );
    if (!response.data) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Lemon Squeezy subscription not found"
      );
    }

    return response.data.data.attributes.urls.customer_portal;
  } catch (error) {
    logger.error(error);
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Lemon Squeezy subscription not found"
    );
  }
};

const createCheckoutLS = async (
  variantId: string,
  userId: string,
  userEmail: string,
  userName: string
): Promise<string | null> => {
  try {
    const checkoutData = {
      data: {
        type: "checkouts",
        attributes: {
          custom_price: 0,
          checkout_data: {
            email: userEmail,
            name: userName || userEmail,
            custom: {
              user_id: userId,
            },
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
          test_mode: env.NODE_ENV !== "production",
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: config.billing.storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    };

    const response = await axiosInstance.post("/checkouts", checkoutData);
    const checkoutUrl = response.data.data.attributes.url;

    if (!response.data) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Lemon Squeezy checkout failed"
      );
    }

    return checkoutUrl;
  } catch (error) {
    logger.error(error);
    throw new ApiError(httpStatus.NOT_FOUND, "Lemon Squeezy checkout failed");
  }
};

export const lemonSqueezyService = {
  retrieveSubscription,
  createCheckout: createCheckoutLS,
};
