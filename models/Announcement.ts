import mongoose, { Schema, Model } from 'mongoose';

export interface IAnnouncement {
  _id?: mongoose.Types.ObjectId;
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  type: 'banner' | 'modal';
  target: 'all' | 'free' | 'paid';
  active: boolean;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    ctaText: { type: String, trim: true },
    ctaUrl: { type: String, trim: true },
    type: { type: String, enum: ['banner', 'modal'], default: 'banner' },
    target: { type: String, enum: ['all', 'free', 'paid'], default: 'all' },
    active: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ active: 1, expiresAt: 1 });

const Announcement: Model<IAnnouncement> =
  (mongoose.models && mongoose.models.Announcement) ||
  mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

export default Announcement;
