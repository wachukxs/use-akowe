import mongoose, { Schema, Model } from 'mongoose';

export type EngagementCohort =
  | 'ghost_signup'
  | 'stuck_starter'
  | 'almost_activated'
  | 'going_idle'
  | 'win_back';

export interface IEmailLog {
  userId: string; // email address
  cohort: EngagementCohort;
  sentAt: Date;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    userId: {
      type: String,
      required: true,
    },
    cohort: {
      type: String,
      enum: ['ghost_signup', 'stuck_starter', 'almost_activated', 'going_idle', 'win_back'],
      required: true,
    },
    sentAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      required: true,
    },
    messageId: {
      type: String,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate sends: one email per cohort per user
EmailLogSchema.index({ userId: 1, cohort: 1 }, { unique: true });
EmailLogSchema.index({ cohort: 1 });
EmailLogSchema.index({ status: 1 });

const EmailLog: Model<IEmailLog> =
  (mongoose.models && mongoose.models.EmailLog) ||
  mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);

export default EmailLog;
