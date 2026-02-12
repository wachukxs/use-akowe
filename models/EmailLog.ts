import mongoose, { Schema, Model } from 'mongoose';

export type EngagementCohort =
  | 'ghost_signup'
  | 'stuck_starter'
  | 'almost_activated'
  | 'going_idle'
  | 'win_back';

export interface IEmailLog {
  _id?: mongoose.Types.ObjectId;
  userId: string;
  cohort: EngagementCohort;
  sentAt: Date;
  status: 'sent' | 'failed';
  error?: string;
  messageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    cohort: {
      type: String,
      enum: ['ghost_signup', 'stuck_starter', 'almost_activated', 'going_idle', 'win_back'],
      required: true,
    },
    sentAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      required: true,
      default: 'sent',
    },
    error: {
      type: String,
    },
    messageId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// De-duplication: each user gets each cohort email at most once
EmailLogSchema.index({ userId: 1, cohort: 1 }, { unique: true });
// Admin queries: daily send counts
EmailLogSchema.index({ sentAt: -1 });
// Admin queries: cohort breakdown
EmailLogSchema.index({ cohort: 1, sentAt: -1 });

const EmailLog: Model<IEmailLog> =
  (mongoose.models && mongoose.models.EmailLog) ||
  mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);

export default EmailLog;
