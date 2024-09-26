import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import { IBillingWebhookModel, IBillingWebhookDoc } from './billing-webhook.interface';

const billingWebhookSchema = new mongoose.Schema<IBillingWebhookDoc, IBillingWebhookModel>(
  {
    eventName: {
      type: String,
      required: true,
    },
    processed: {
      type: Boolean,
      default: false,
    },
    eventBody: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    processingError: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'billing-webhooks',
  }
);

// add plugin that converts mongoose to json
billingWebhookSchema.plugin(toJSON);

const BillingWebhook = mongoose.model<IBillingWebhookDoc, IBillingWebhookModel>('BillingWebhook', billingWebhookSchema);

export default BillingWebhook;
