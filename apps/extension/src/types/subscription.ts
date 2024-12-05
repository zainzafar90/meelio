export type Subscription = {
  lemonSqueezyId: number;
  subscriptionItemId?: number | null;
  orderId: number;
  name: string;
  email: string;
  status: string;
  renewsAt?: Date;
  endsAt?: Date;
  trialEndsAt?: Date;
  resumesAt?: Date;
  priceId: number;
  planId: number;
  userId: string;
  cancelled: boolean;
  productName: string;
  updatePaymentUrl?: string;
  customerPortalUrl?: string;
  isUsageBased?: boolean;
};

export enum PlanInterval {
  Monthly = "monthly",
  Yearly = "yearly",
  Lifetime = "lifetime",
}
