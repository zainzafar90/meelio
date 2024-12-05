import { Subscription } from "@/types/subscription";
import { axios } from "@/api/axios";

export function getSubscription({
  subscriptionId,
}: {
  subscriptionId: string;
}): Promise<Subscription | null> {
  return axios.get(`/v1/subscriptions/${subscriptionId}`);
}

export function getLemonSqueezyPortalUrl({
  subscriptionId,
}: {
  subscriptionId: string;
}): Promise<{ url: string } | null> {
  return axios.get(`/v1/subscriptions/${subscriptionId}/portal`);
}

export function getLemonSqeezyCheckoutUrl({
  variantId,
}: {
  variantId: string;
}): Promise<{ url: string } | null> {
  return axios.get(`/v1/subscriptions/checkout`, {
    params: {
      variantId,
    },
  });
}
