import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  role: 'hospital_admin' | 'school_admin';
  amount: number;
  utr: string;
  screenshot: string;
  status: 'pending' | 'active' | 'rejected' | 'expired';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['hospital_admin', 'school_admin'], required: true },
    amount: { type: Number, required: true },
    utr: { type: String, required: true },
    screenshot: { type: String, required: true },
    status: { type: String, enum: ['pending', 'active', 'rejected', 'expired'], default: 'pending' },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
