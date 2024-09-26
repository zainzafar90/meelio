import mongoose from "mongoose";
import toJSON from "../toJSON/toJSON";
import { ISubscriptionDoc, ISubscriptionModel } from "./subscription.interface";

const subscriptionSchema = new mongoose.Schema<
  ISubscriptionDoc,
  ISubscriptionModel
>(
  {
    lemonSqueezyId: {
      type: Number,
      unique: true,
      required: true,
    },
    subscriptionItemId: {
      type: Number,
      unique: true,
    },
    orderId: {
      type: Number,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
    },
    priceId: {
      type: Number,
      required: true,
    },
    planId: {
      type: Number,
      required: false,
    },
    renewsAt: {
      type: Date,
    },
    endsAt: {
      type: Date,
    },
    trialEndsAt: {
      type: Date,
    },
    resumesAt: {
      type: Date,
    },
    userId: {
      type: String,
      ref: "User",
    },
    cancelled: {
      type: Boolean,
      default: false,
    },
    productName: {
      type: String,
    },
    updatePaymentUrl: {
      type: String,
    },
    customerPortalUrl: {
      type: String,
    },
    isUsageBased: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
subscriptionSchema.plugin(toJSON);

const Subscription = mongoose.model<ISubscriptionDoc, ISubscriptionModel>(
  "Subscription",
  subscriptionSchema
);
// Subscription.createIndexes();

export default Subscription;
