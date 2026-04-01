import mongoose, { Schema, Model } from 'mongoose';
import type { WisePaymentLinkSku } from '@/lib/wise-payment-links';

export interface IWiseCheckoutAttempt {
  userId: mongoose.Types.ObjectId;
  reference: string;
  plan: 'standard' | 'pro';
  billingCycle: 'monthly' | 'annual';
  sku: WisePaymentLinkSku;
  status: 'pending' | 'completed' | 'cancelled';
  transferId?: number | null;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const WiseCheckoutAttemptSchema = new Schema<IWiseCheckoutAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reference: { type: String, required: true, unique: true },
    plan: { type: String, enum: ['standard', 'pro'], required: true },
    billingCycle: { type: String, enum: ['monthly', 'annual'], required: true },
    sku: {
      type: String,
      enum: ['annual_pro', 'annual_standard', 'monthly_standard', 'monthly_pro'],
      required: true,
    },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
    transferId: { type: Number, default: null },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

WiseCheckoutAttemptSchema.index({ userId: 1, status: 1, createdAt: -1 });
WiseCheckoutAttemptSchema.index({ status: 1, expiresAt: 1 });
WiseCheckoutAttemptSchema.index({ createdAt: 1 });

const WiseCheckoutAttempt: Model<IWiseCheckoutAttempt> =
  (mongoose.models && mongoose.models.WiseCheckoutAttempt) ||
  mongoose.model<IWiseCheckoutAttempt>('WiseCheckoutAttempt', WiseCheckoutAttemptSchema);

export default WiseCheckoutAttempt;

