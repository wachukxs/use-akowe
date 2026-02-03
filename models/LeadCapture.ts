import mongoose, { Schema, Document } from 'mongoose';

export interface ILeadCapture extends Document {
  email: string;
  source: 'plagiarism' | 'import' | 'topic';
  variant: 'control' | 'variant_a' | 'variant_b';
  capturedAt: Date;
  convertedAt?: Date;
  userId?: string; // Set when they sign up
  metadata?: {
    charCount?: number;
    fileType?: string;
    fileName?: string;
  };
}

const LeadCaptureSchema = new Schema<ILeadCapture>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    source: { type: String, required: true, enum: ['plagiarism', 'import', 'topic'] },
    variant: { type: String, required: true, enum: ['control', 'variant_a', 'variant_b'] },
    capturedAt: { type: Date, default: Date.now },
    convertedAt: { type: Date },
    userId: { type: String },
    metadata: {
      charCount: Number,
      fileType: String,
      fileName: String,
      topic: String,
      projectType: String,
      methodology: String,
      uniquenessScore: Number,
      readinessScore: Number,
    },
  },
  { timestamps: true }
);

// Compound index for unique email per source (allow same email for different tools)
LeadCaptureSchema.index({ email: 1, source: 1 }, { unique: true });

export default (mongoose.models && mongoose.models.LeadCapture) || mongoose.model<ILeadCapture>('LeadCapture', LeadCaptureSchema);
