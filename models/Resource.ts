import mongoose, { Schema, Model } from 'mongoose';

interface IResource {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  link: string;
  rating: number;
  downloads: number;
  type: string;
  tags: string[];
  isRecommended?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Writing', 'Citations', 'Research', 'Presentation', 'Ethics', 'Methodology'],
    },
    link: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      required: true,
      enum: ['PDF', 'E-book', 'DOCX', 'Article', 'Video', 'Template'],
    },
    tags: [{
      type: String,
      lowercase: true,
    }],
    isRecommended: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ResourceSchema.index({ category: 1 });
ResourceSchema.index({ tags: 1 });
ResourceSchema.index({ rating: -1 });
ResourceSchema.index({ downloads: -1 });

const Resource: Model<IResource> = mongoose.models.Resource || mongoose.model<IResource>('Resource', ResourceSchema);

export default Resource;
