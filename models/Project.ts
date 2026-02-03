import mongoose, { Schema, Model } from 'mongoose';
import { Project as ProjectType, Section, Citation, PDF, PlagiarismCheck } from '@/types';

interface IProject extends Omit<ProjectType, '_id'> {
  _id?: mongoose.Types.ObjectId;
}

const SectionSchema = new Schema<Section>(
  {
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['introduction', 'literature_review', 'methodology', 'results', 'discussion', 'conclusion', 'custom'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const CitationSchema = new Schema<Citation>(
  {
    id: {
      type: String,
      required: true,
    },
    doi: String,
    title: {
      type: String,
      required: true,
    },
    authors: [String],
    year: Number,
    journal: String,
    publisher: String,
    url: String,
    citationKey: {
      type: String,
      required: true,
    },
    citationText: {
      type: String,
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const PDFSchema = new Schema<PDF>(
  {
    id: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const PlagiarismCheckSchema = new Schema<PlagiarismCheck>(
  {
    checkedAt: {
      type: Date,
      default: Date.now,
    },
    matchPercentage: {
      type: Number,
      required: true,
    },
    matches: [
      {
        text: String,
        source: String,
        url: String,
        similarity: Number,
        section: String,
        suggestion: String,
      },
    ],
    sectionAnalysis: [
      {
        sectionId: String,
        sectionTitle: String,
        matchPercentage: Number,
        matches: [
          {
            text: String,
            source: String,
            url: String,
            similarity: Number,
            section: String,
            suggestion: String,
          },
        ],
        wordCount: Number,
      },
    ],
    analysis: {
      overusedPhrases: Number,
      repetitionIssues: Number,
      citationProblems: Number,
      aiPatterns: Number,
      wordDiversity: Number,
      externalMatches: Number,
      paraphrasingDetected: Number,
    },
    reportUrl: String,
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['essay', 'thesis', 'journal', 'research'],
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    targetWordCount: {
      type: Number,
      default: 0,
    },
    citationStyle: {
      type: String,
      enum: ['APA', 'MLA', 'Chicago', 'IEEE', 'Harvard'],
      default: 'APA',
    },
    methodology: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'completed', 'archived'],
      default: 'draft',
    },
    sections: {
      type: [SectionSchema],
      default: [],
    },
    citations: {
      type: [CitationSchema],
      default: [],
    },
    pdfs: {
      type: [PDFSchema],
      default: [],
    },
    plagiarismChecks: {
      type: [PlagiarismCheckSchema],
      default: [],
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ userId: 1, createdAt: -1 });
ProjectSchema.index({ userId: 1, lastEditedAt: -1 });
// Compound index for user projects with date range filtering (ascending for date ranges)
ProjectSchema.index({ userId: 1, createdAt: 1 }); // Optimizes queries like: Project.find({ userId: { $in: userIds }, createdAt: { $gte: start, $lte: end } })
// Indexes for admin metrics queries
ProjectSchema.index({ createdAt: 1 });
ProjectSchema.index({ updatedAt: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ createdAt: 1, status: 1 }); // Compound for period queries

const Project: Model<IProject> = (mongoose.models && mongoose.models.Project) || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;

