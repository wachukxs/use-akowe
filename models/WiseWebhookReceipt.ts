import mongoose, { Schema, Model } from 'mongoose';

/** Idempotency for Wise webhooks (swift-in uetr, or X-Delivery-Id fallback). */
export interface IWiseWebhookReceipt {
  dedupeKey: string;
  eventType: string;
  createdAt?: Date;
}

const WiseWebhookReceiptSchema = new Schema<IWiseWebhookReceipt>(
  {
    dedupeKey: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
  },
  { timestamps: true }
);

WiseWebhookReceiptSchema.index({ createdAt: 1 });

const WiseWebhookReceipt: Model<IWiseWebhookReceipt> =
  (mongoose.models && mongoose.models.WiseWebhookReceipt) ||
  mongoose.model<IWiseWebhookReceipt>('WiseWebhookReceipt', WiseWebhookReceiptSchema);

export default WiseWebhookReceipt;
