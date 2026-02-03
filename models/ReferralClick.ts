import mongoose, { Schema, Document } from 'mongoose';

export interface IReferralClick extends Document {
  referralCode: string;
  clickedAt: Date;
  userAgent?: string;
  ipAddress?: string;
  converted?: boolean; // Set to true when user signs up with this code
  convertedAt?: Date;
}

const ReferralClickSchema = new Schema<IReferralClick>(
  {
    referralCode: { type: String, required: true, index: true },
    clickedAt: { type: Date, default: Date.now, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    converted: { type: Boolean, default: false, index: true },
    convertedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for efficient queries on referral code and conversion status
ReferralClickSchema.index({ referralCode: 1, converted: 1 });

export default (mongoose.models && mongoose.models.ReferralClick) || mongoose.model<IReferralClick>('ReferralClick', ReferralClickSchema);
