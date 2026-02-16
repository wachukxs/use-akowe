import mongoose, { Schema, Model } from 'mongoose';

export interface ITextAnchor {
  selectedText: string;
  prefix: string;
  suffix: string;
  sectionId: string;
  startOffset: number;
  endOffset: number;
}

export interface IReviewComment {
  _id?: mongoose.Types.ObjectId;
  shareLinkId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  sectionId: string;
  advisorName: string;
  advisorSessionId: string;
  commentType: 'inline' | 'general';
  textAnchor?: ITextAnchor;
  content: string;
  parentCommentId?: mongoose.Types.ObjectId;
  authorType: 'advisor' | 'student';
  authorEmail?: string;
  status: 'open' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const TextAnchorSchema = new Schema<ITextAnchor>(
  {
    selectedText: { type: String, required: true },
    prefix: { type: String, default: '' },
    suffix: { type: String, default: '' },
    sectionId: { type: String, required: true },
    startOffset: { type: Number, required: true },
    endOffset: { type: Number, required: true },
  },
  { _id: false }
);

const ReviewCommentSchema = new Schema<IReviewComment>(
  {
    shareLinkId: {
      type: Schema.Types.ObjectId,
      ref: 'ShareLink',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    sectionId: {
      type: String,
      required: true,
    },
    advisorName: {
      type: String,
      required: true,
    },
    advisorSessionId: {
      type: String,
      required: true,
    },
    commentType: {
      type: String,
      enum: ['inline', 'general'],
      required: true,
    },
    textAnchor: {
      type: TextAnchorSchema,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'ReviewComment',
    },
    authorType: {
      type: String,
      enum: ['advisor', 'student'],
      required: true,
    },
    authorEmail: {
      type: String,
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

// Fetch all comments for a project (student view)
ReviewCommentSchema.index({ projectId: 1, sectionId: 1, status: 1 });
// Fetch all comments for a share link (advisor view)
ReviewCommentSchema.index({ shareLinkId: 1, createdAt: -1 });

const ReviewComment: Model<IReviewComment> =
  (mongoose.models && mongoose.models.ReviewComment) ||
  mongoose.model<IReviewComment>('ReviewComment', ReviewCommentSchema);

export default ReviewComment;
