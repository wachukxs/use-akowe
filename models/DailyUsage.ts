import mongoose, { Schema, Model } from 'mongoose';
import { DailyUsage as DailyUsageType } from '@/types';

interface IDailyUsage extends Omit<DailyUsageType, '_id'> {
  _id?: mongoose.Types.ObjectId;
}

const DailyUsageSchema = new Schema<IDailyUsage>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    aiWordsGenerated: {
      type: Number,
      default: 0,
    },
    plagiarismChecks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

DailyUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyUsage: Model<IDailyUsage> = mongoose.models.DailyUsage || mongoose.model<IDailyUsage>('DailyUsage', DailyUsageSchema);

export default DailyUsage;

