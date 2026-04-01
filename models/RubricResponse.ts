import mongoose, { Schema, Model } from 'mongoose';

export interface IRubricAnswer {
  question: string;
  answer: string;
}

export interface IRubricResponse {
  _id?: mongoose.Types.ObjectId;
  shareLinkId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  advisorName: string;
  advisorSessionId: string;
  answers: IRubricAnswer[];
  createdAt: Date;
  updatedAt: Date;
}

const RubricAnswerSchema = new Schema<IRubricAnswer>(
  {
    question: { type: String, required: true },
    answer: { type: String, default: '' },
  },
  { _id: false }
);

const RubricResponseSchema = new Schema<IRubricResponse>(
  {
    shareLinkId: {
      type: Schema.Types.ObjectId,
      ref: 'ShareLink',
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    advisorName: { type: String, required: true },
    advisorSessionId: { type: String, required: true },
    answers: { type: [RubricAnswerSchema], default: [] },
  },
  { timestamps: true }
);

// One response per share link (advisors share a link, so one rubric per link)
RubricResponseSchema.index({ shareLinkId: 1 }, { unique: true });

const RubricResponse: Model<IRubricResponse> =
  (mongoose.models && mongoose.models.RubricResponse) ||
  mongoose.model<IRubricResponse>('RubricResponse', RubricResponseSchema);

export default RubricResponse;
