import { Document, Model } from 'mongoose';

export interface ISubscription {
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
}

export interface ISubscriptionDoc extends ISubscription, Document {}
export interface ISubscriptionModel extends Model<ISubscriptionDoc> {}
