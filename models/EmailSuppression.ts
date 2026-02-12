import mongoose, { Schema, Model } from 'mongoose';

export type SuppressionReason = 'unsubscribed' | 'bounced' | 'complained';

export interface IEmailSuppression {
  _id?: mongoose.Types.ObjectId;
  email: string;
  reason: SuppressionReason;
  suppressedAt: Date;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailSuppressionSchema = new Schema<IEmailSuppression>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reason: {
      type: String,
      enum: ['unsubscribed', 'bounced', 'complained'],
      required: true,
    },
    suppressedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    source: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const EmailSuppression: Model<IEmailSuppression> =
  (mongoose.models && mongoose.models.EmailSuppression) ||
  mongoose.model<IEmailSuppression>('EmailSuppression', EmailSuppressionSchema);

export default EmailSuppression;
