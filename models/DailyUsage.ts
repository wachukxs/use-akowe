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
    topicFinderSearches: {
      type: Number,
      default: 0,
    },
    paraphraseUses: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

DailyUsageSchema.index({ userId: 1, date: 1 }, { unique: true });
// Additional indexes for admin metrics queries
DailyUsageSchema.index({ date: 1 }); // For date range queries
DailyUsageSchema.index({ date: -1, userId: 1 }); // For engagement queries

const DailyUsage: Model<IDailyUsage> = (mongoose.models && mongoose.models.DailyUsage) || mongoose.model<IDailyUsage>('DailyUsage', DailyUsageSchema);

export default DailyUsage;

