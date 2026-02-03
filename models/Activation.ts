import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IActivation extends mongoose.Document {
  userId: string;
  firstProjectCreatedAt: Date | null;
  firstOutputGeneratedAt: Date | null;
  activatedAt: Date | null;
  timeToActivation: number | null; // in minutes
  isActivated: boolean;
  // Attribution data
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  channel?: string; // Derived from utm_medium (e.g., 'referral', 'organic', 'paid', 'direct')
  source?: string; // utm_source or referral source
  country?: string;
  landingPage?: string; // First page visited
  toolEntryPoint?: 'plagiarism' | 'import' | 'topic' | 'direct'; // How user entered
  createdAt: Date;
  updatedAt: Date;
}

const ActivationSchema = new Schema<IActivation>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    firstProjectCreatedAt: {
      type: Date,
      default: null,
    },
    firstOutputGeneratedAt: {
      type: Date,
      default: null,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    timeToActivation: {
      type: Number,
      default: null, // minutes
    },
    isActivated: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Attribution fields
    utmSource: {
      type: String,
      index: true,
    },
    utmMedium: {
      type: String,
      index: true,
    },
    utmCampaign: {
      type: String,
    },
    channel: {
      type: String,
      index: true,
    },
    source: {
      type: String,
      index: true,
    },
    country: {
      type: String,
      index: true,
    },
    landingPage: {
      type: String,
    },
    toolEntryPoint: {
      type: String,
      enum: ['plagiarism', 'import', 'topic', 'direct'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
ActivationSchema.index({ isActivated: 1, channel: 1 });
ActivationSchema.index({ isActivated: 1, source: 1 });
ActivationSchema.index({ isActivated: 1, country: 1 });
ActivationSchema.index({ isActivated: 1, toolEntryPoint: 1 });
ActivationSchema.index({ activatedAt: 1 });
ActivationSchema.index({ createdAt: 1 });

const Activation: Model<IActivation> = (mongoose.models && mongoose.models.Activation) || mongoose.model<IActivation>('Activation', ActivationSchema);

export default Activation;
