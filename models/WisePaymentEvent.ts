import mongoose, { Schema, Model } from 'mongoose';

export interface IWisePaymentEvent {
  provider: 'wise';
  transferId: string;
  eventKind: 'payment' | 'refund';
  eventType: string;
  userId?: mongoose.Types.ObjectId | null;
  amount: number;
  currency: string;
  amountUsd?: number | null;
  status?: string;
  plan?: 'standard' | 'pro' | 'team' | 'free' | null;
  billingCycle?: 'monthly' | 'annual' | null;
  occurredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const WisePaymentEventSchema = new Schema<IWisePaymentEvent>(
  {
    provider: { type: String, enum: ['wise'], required: true, default: 'wise' },
    transferId: { type: String, required: true },
    eventKind: { type: String, enum: ['payment', 'refund'], required: true },
    eventType: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    amountUsd: { type: Number, default: null },
    status: { type: String },
    plan: { type: String, enum: ['free', 'standard', 'pro', 'team'], default: null },
    billingCycle: { type: String, enum: ['monthly', 'annual'], default: null },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

WisePaymentEventSchema.index({ provider: 1, transferId: 1, eventKind: 1 }, { unique: true });
WisePaymentEventSchema.index({ createdAt: 1 });
WisePaymentEventSchema.index({ eventKind: 1, createdAt: 1 });
WisePaymentEventSchema.index({ userId: 1, createdAt: -1 });

const WisePaymentEvent: Model<IWisePaymentEvent> =
  (mongoose.models && mongoose.models.WisePaymentEvent) ||
  mongoose.model<IWisePaymentEvent>('WisePaymentEvent', WisePaymentEventSchema);

export default WisePaymentEvent;

