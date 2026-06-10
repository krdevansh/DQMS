import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  phone: string;
  otp: string;
  type: 'register' | 'forgot-pin';
  verified: boolean;
  expiresAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ['register', 'forgot-pin'], required: true },
  verified: { type: Boolean, default: false },
  // TTL index: MongoDB auto-deletes docs after expiresAt
  expiresAt: { type: Date, required: true },
});

// Compound index for fast lookup
OtpSchema.index({ phone: 1, type: 1 });
// TTL index: auto-delete expired OTPs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model<IOtp>('Otp', OtpSchema);
