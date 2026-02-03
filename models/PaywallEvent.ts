import mongoose, { Schema, Document } from 'mongoose';

export interface IPaywallEvent extends Document {
  userId: string;
  variant: 'variant_a' | 'variant_b';
  eventType: 'paywall_view' | 'export_attempt' | 'preview_view' | 'conversion';
  context?: string; // e.g., 'ai_assistant', 'ai_write', 'export', etc.
  createdAt: Date;
}

const PaywallEventSchema = new Schema<IPaywallEvent>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    variant: {
      type: String,
      required: true,
      enum: ['variant_a', 'variant_b'],
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: ['paywall_view', 'export_attempt', 'preview_view', 'conversion'],
      index: true,
    },
    context: {
      type: String, // Optional context like 'ai_assistant', 'ai_write', 'export'
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound indexes for efficient queries
PaywallEventSchema.index({ userId: 1, variant: 1, eventType: 1 });
PaywallEventSchema.index({ variant: 1, eventType: 1, createdAt: -1 });
PaywallEventSchema.index({ eventType: 1, createdAt: -1 });

// TTL index: Auto-delete events after 90 days
PaywallEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days in seconds

export default (mongoose.models && mongoose.models.PaywallEvent) || mongoose.model<IPaywallEvent>('PaywallEvent', PaywallEventSchema);
