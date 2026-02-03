import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User as UserType, PlanType } from '@/types';

interface IUser extends Omit<UserType, '_id'> {
  _id?: mongoose.Types.ObjectId;
  password?: string; // Add password field for internal use
  billingCycle?: 'monthly' | 'annual'; // Add billing cycle field
  subscriptionStartDate?: Date | null; // When subscription started (from Stripe)
  subscriptionEndDate?: Date | null; // When subscription ended (null if active)
  // Referral system fields
  referralCode?: string; // Unique code for this user to share
  referredBy?: mongoose.Types.ObjectId; // User who referred this user
  referredByInfluencer?: mongoose.Types.ObjectId; // Influencer who referred this user
  // Topic finder usage tracking
  topicFinderUsage?: {
    date: Date;
    count: number;
  };
}

const UserSchema = new Schema<IUser>(
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
    password: {
      type: String,
      required: false, // Optional for Google OAuth users
    },
    image: {
      type: String,
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'team'] as PlanType[],
      default: 'free',
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual'],
      default: 'monthly',
    },
    subscriptionStartDate: {
      type: Date,
      default: null,
    },
    subscriptionEndDate: {
      type: Date,
      default: null,
    },
    // Referral system fields
    referralCode: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values while maintaining uniqueness for non-null
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    referredByInfluencer: {
      type: Schema.Types.ObjectId,
      ref: 'Influencer',
    },
    // Topic finder usage tracking (for free tier limits)
    topicFinderUsage: {
      date: {
        type: Date,
        default: Date.now,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for admin metrics queries
UserSchema.index({ createdAt: 1 });
UserSchema.index({ plan: 1 });
UserSchema.index({ stripeSubscriptionId: 1 });
UserSchema.index({ createdAt: -1 }); // For recent users query
// Compound index for common query pattern: filter by plan + date range + sort by date
UserSchema.index({ plan: 1, createdAt: -1 }); // Optimizes queries like: User.find({ plan: 'free', createdAt: { $gte: start, $lte: end } })
// Note: referralCode index is already created by unique: true in the schema definition
UserSchema.index({ referredBy: 1 }); // For counting referrals per user
UserSchema.index({ referredByInfluencer: 1 }); // For counting referrals per influencer

const User: Model<IUser> = (mongoose.models && mongoose.models.User) || mongoose.model<IUser>('User', UserSchema);

export default User;

