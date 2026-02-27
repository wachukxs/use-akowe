import mongoose, { Schema, Model } from 'mongoose';

export interface IAffiliateApplication {
  _id?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  website?: string;
  promotionMethod: 'blog' | 'youtube' | 'social_media' | 'paid_ads' | 'newsletter' | 'other';
  audienceSize?: string;
  message?: string;
  status: 'pending' | 'approved' | 'denied';
  reviewedAt?: Date;
  reviewedByAdminId?: string;
  influencerId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const AffiliateApplicationSchema = new Schema<IAffiliateApplication>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    website: {
      type: String,
    },
    promotionMethod: {
      type: String,
      enum: ['blog', 'youtube', 'social_media', 'paid_ads', 'newsletter', 'other'],
      required: true,
    },
    audienceSize: {
      type: String,
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending',
    },
    reviewedAt: {
      type: Date,
    },
    reviewedByAdminId: {
      type: String,
    },
    influencerId: {
      type: Schema.Types.ObjectId,
      ref: 'Influencer',
    },
  },
  {
    timestamps: true,
  }
);

AffiliateApplicationSchema.index({ email: 1 });
AffiliateApplicationSchema.index({ status: 1 });
AffiliateApplicationSchema.index({ email: 1, status: 1 });

const AffiliateApplication: Model<IAffiliateApplication> =
  (mongoose.models && mongoose.models.AffiliateApplication) ||
  mongoose.model<IAffiliateApplication>('AffiliateApplication', AffiliateApplicationSchema);

export default AffiliateApplication;
