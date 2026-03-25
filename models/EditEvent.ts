import mongoose, { Schema, Model } from 'mongoose';

/**
 * EditEvent — lightweight authorship trail entry.
 * Recorded on every project save. Does NOT store full content
 * (too expensive) — stores word counts and section IDs touched.
 * Used to generate integrity/authorship reports.
 */
export interface IEditEvent {
  _id?: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  userId: string;
  // Snapshot metadata at time of save
  totalWordCount: number;
  citationCount: number;
  sectionSnapshots: Array<{
    sectionId: string;
    title: string;
    wordCount: number;
  }>;
  // Rolling hash of all section content — lets us detect genuine changes
  contentHash: string;
  createdAt: Date;
}

const EditEventSchema = new Schema<IEditEvent>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    totalWordCount: {
      type: Number,
      default: 0,
    },
    citationCount: {
      type: Number,
      default: 0,
    },
    sectionSnapshots: [
      {
        sectionId: String,
        title: String,
        wordCount: Number,
        _id: false,
      },
    ],
    contentHash: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for retrieving project history in order
EditEventSchema.index({ projectId: 1, createdAt: -1 });

// TTL — keep events for 2 years (sufficient for thesis defense)
EditEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 730 });

const EditEvent: Model<IEditEvent> =
  (mongoose.models && mongoose.models.EditEvent) ||
  mongoose.model<IEditEvent>('EditEvent', EditEventSchema);

export default EditEvent;
