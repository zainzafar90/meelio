// import mongoose from "mongoose";
// import toJSON from "../toJSON/toJSON";
// import { ISubscriptionDoc, ISubscriptionModel } from "./subscription.interface";

// const subscriptionSchema = new mongoose.Schema<
//   ISubscriptionDoc,
//   ISubscriptionModel
// >(
//   {
//     lemonSqueezyId: {
//       type: Number,
//       unique: true,
//       required: true,
//     },
//     subscriptionItemId: {
//       type: Number,
//       unique: true,
//     },
//     orderId: {
//       type: Number,
//       unique: true,
//       required: true,
//     },
//     name: {
//       type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       index: true,
//     },
//     status: {
//       type: String,
//       required: true,
//     },
//     priceId: {
//       type: Number,
//       required: true,
//     },
//     planId: {
//       type: Number,
//       required: false,
//     },
//     renewsAt: {
//       type: Date,
//     },
//     endsAt: {
//       type: Date,
//     },
//     trialEndsAt: {
//       type: Date,
//     },
//     resumesAt: {
//       type: Date,
//     },
//     userId: {
//       type: String,
//       ref: "User",
//     },
//     cancelled: {
//       type: Boolean,
//       default: false,
//     },
//     productName: {
//       type: String,
//     },
//     updatePaymentUrl: {
//       type: String,
//     },
//     customerPortalUrl: {
//       type: String,
//     },
//     isUsageBased: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // add plugin that converts mongoose to json
// subscriptionSchema.plugin(toJSON);

// const Subscription = mongoose.model<ISubscriptionDoc, ISubscriptionModel>(
//   "Subscription",
//   subscriptionSchema
// );
// // Subscription.createIndexes();

// export default Subscription;

import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { users } from "./user.schema";
import { createdAt, id, updatedAt } from "./helpers/date-helpers";

export const subscriptions = pgTable("subscriptions", {
  id,
  lemonSqueezyId: text("lemon_squeezy_id").notNull(),
  subscriptionItemId: text("subscription_item_id").notNull(),
  orderId: text("order_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull(),
  priceId: text("price_id").notNull(),
  planId: text("plan_id"),
  renewsAt: timestamp("renews_at"),
  endsAt: timestamp("ends_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  resumesAt: timestamp("resumes_at"),
  userId: text("user_id").notNull(),
  cancelled: boolean("cancelled").notNull().default(false),
  productName: text("product_name"),
  updatePaymentUrl: text("update_payment_url"),
  customerPortalUrl: text("customer_portal_url"),
  isUsageBased: boolean("is_usage_based").notNull().default(false),
  createdAt,
  updatedAt,
});

export type Subscription = typeof subscriptions.$inferSelect;
export type SubscriptionInsert = typeof subscriptions.$inferInsert;

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));
