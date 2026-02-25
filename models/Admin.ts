import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type AdminRole = 'full_access' | 'read_only';

export interface IAdmin {
  _id?: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: AdminRole;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['full_access', 'read_only'] satisfies AdminRole[],
      required: true,
      default: 'read_only',
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

AdminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin: Model<IAdmin> =
  (mongoose.models && mongoose.models.Admin) ||
  mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;
