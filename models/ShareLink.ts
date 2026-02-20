import mongoose, { Schema, Model } from 'mongoose';

export interface IShareLink {
  _id?: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  userId: string; // student email (matches Project.userId pattern)
  token: string;
  advisorName: string;
  advisorEmail?: string;
  sectionIds: string[]; // empty = all sections
  expiresAt: Date;
  revokedAt?: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  lastNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShareLinkSchema = new Schema<IShareLink>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    advisorName: {
      type: String,
      required: true,
    },
    advisorEmail: {
      type: String,
      lowercase: true,
    },
    sectionIds: {
      type: [String],
      default: [],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
    },
    lastAccessedAt: {
      type: Date,
    },
    accessCount: {
      type: Number,
      default: 0,
    },
    lastNotifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Find all links for a project by owner
ShareLinkSchema.index({ userId: 1, projectId: 1 });
// Auto-delete 30 days after expiry
ShareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const ShareLink: Model<IShareLink> =
  (mongoose.models && mongoose.models.ShareLink) ||
  mongoose.model<IShareLink>('ShareLink', ShareLinkSchema);

export default ShareLink;
