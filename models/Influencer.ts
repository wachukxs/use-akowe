import mongoose, { Schema, Model } from 'mongoose';

export interface IInfluencer {
  _id?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  referralCode: string;
  notes?: string; // Optional notes about the influencer
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
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient lookups
InfluencerSchema.index({ referralCode: 1 });
InfluencerSchema.index({ email: 1 });

const Influencer: Model<IInfluencer> = 
  mongoose.models.Influencer || mongoose.model<IInfluencer>('Influencer', InfluencerSchema);

export default Influencer;
