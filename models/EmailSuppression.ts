import mongoose, { Schema, Model } from 'mongoose';

export interface IEmailSuppression {
  email: string;
  reason: 'bounced' | 'complained' | 'unsubscribed';
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailSuppressionSchema = new Schema<IEmailSuppression>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    reason: {
      type: String,
      enum: ['bounced', 'complained', 'unsubscribed'],
      required: true,
    },
    source: {
      type: String,
      required: true,
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
