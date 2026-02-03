import mongoose, { Schema, Model } from 'mongoose';

export interface IInfluencer {
  _id?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  referralCode: string;
  notes?: string; // Optional notes about the influencer
  // Quality scoring fields (cached for performance)
  qualityScore?: number; // Overall quality score (0-100)
  activationRate?: number; // Percentage of referrals who created at least 1 project
  paidConversionRate?: number; // Percentage of referrals who upgraded to paid
  avgActiveDays?: number; // Average active days per referred user
  qualityScoreLastCalculated?: Date; // When the quality score was last calculated
  createdAt?: Date;
  updatedAt?: Date;
}

const InfluencerSchema = new Schema<IInfluencer>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
    },
    notes: {
      type: String,
    },
    // Quality scoring fields (cached for performance)
    qualityScore: {
      type: Number,
      default: null,
    },
    activationRate: {
      type: Number,
      default: null,
    },
    paidConversionRate: {
      type: Number,
      default: null,
    },
    avgActiveDays: {
      type: Number,
      default: null,
    },
    qualityScoreLastCalculated: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Note: referralCode and email indexes are already created by unique: true in the schema definition

const Influencer: Model<IInfluencer> = 
  (mongoose.models && mongoose.models.Influencer) || mongoose.model<IInfluencer>('Influencer', InfluencerSchema);

export default Influencer;
