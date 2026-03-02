import mongoose, { Schema, Model } from 'mongoose';

export interface IAffiliateCommission {
  _id?: mongoose.Types.ObjectId;
  // Who earned the commission
  referralCode: string;
  referrerId: mongoose.Types.ObjectId;
  referrerType: 'user' | 'influencer';
  // Who paid (the referred user) — multiple commissions per user (one per billing cycle)
  referredUserId: mongoose.Types.ObjectId;
  // Stripe payment data — stripeInvoiceId is the unique key across all commission types
  stripeInvoiceId: string;    // Unique per invoice, prevents duplicate processing
  stripeSessionId?: string;   // Only set on the first payment (from checkout session)
  stripeSubscriptionId: string;
  billingCycle: 'monthly' | 'annual';
  // Which payment in the 12-month commission window (1 = first payment, 2 = first renewal, etc.)
  commissionMonth: number;
  // 'subscription_create' = first payment, 'subscription_cycle' = renewal
  billingReason: 'subscription_create' | 'subscription_cycle';
  // Commission amounts (stored in cents to match Stripe)
  paymentAmount: number;    // Amount the customer paid, in cents
  commissionRate: number;   // e.g. 0.30 for 30%
  commissionAmount: number; // paymentAmount * commissionRate, in cents
  // Payout status
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const AffiliateCommissionSchema = new Schema<IAffiliateCommission>(
  {
    referralCode: { type: String, required: true, index: true },
    referrerId: { type: Schema.Types.ObjectId, required: true, index: true },
    referrerType: { type: String, enum: ['user', 'influencer'], required: true },
    referredUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    // Unique per Stripe invoice — prevents double-processing the same payment
    stripeInvoiceId: { type: String, required: true, unique: true },
    stripeSessionId: { type: String, default: null },
    stripeSubscriptionId: { type: String, required: true },
    billingCycle: { type: String, enum: ['monthly', 'annual'], required: true },
    commissionMonth: { type: Number, required: true, min: 1, max: 12 },
    billingReason: { type: String, enum: ['subscription_create', 'subscription_cycle'], required: true },
    paymentAmount: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending', index: true },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index for querying commissions by referral code and date
AffiliateCommissionSchema.index({ referralCode: 1, createdAt: -1 });
AffiliateCommissionSchema.index({ referrerId: 1, status: 1 });
// Efficiently count how many months of commission a referred user has generated
AffiliateCommissionSchema.index({ referredUserId: 1, billingReason: 1 });

const AffiliateCommission: Model<IAffiliateCommission> =
  (mongoose.models && mongoose.models.AffiliateCommission) ||
  mongoose.model<IAffiliateCommission>('AffiliateCommission', AffiliateCommissionSchema);

export default AffiliateCommission;
