import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User as UserType, PlanType } from '@/types';

interface IUser extends Omit<UserType, '_id'> {
  _id?: mongoose.Types.ObjectId;
  password?: string; // Add password field for internal use
  billingCycle?: 'monthly' | 'annual'; // Add billing cycle field
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
      index: true,
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

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

