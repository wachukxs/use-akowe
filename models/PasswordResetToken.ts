import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IPasswordResetToken {
  userId: Types.ObjectId;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

// Automatically remove expired tokens via TTL index
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetToken: Model<IPasswordResetToken> =
  (mongoose.models && mongoose.models.PasswordResetToken) ||
  mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);

export default PasswordResetToken;
