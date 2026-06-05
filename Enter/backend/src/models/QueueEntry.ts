import mongoose, { Document, Schema } from 'mongoose';

export interface IQueueEntry extends Document {
  salonId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  ticket: string;
  position: number;
  serviceName: string;
  price: number;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';
  skipNote?: string;
  joinedAt: Date;
  servedAt?: Date;
  completedAt?: Date;
}

const QueueEntrySchema = new Schema<IQueueEntry>(
  {
    salonId: { type: Schema.Types.ObjectId, ref: 'Salon', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    ticket: { type: String, required: true },
    position: { type: Number, required: true },
    serviceName: { type: String, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ['waiting', 'serving', 'completed', 'cancelled'],
      default: 'waiting',
    },
    skipNote: { type: String },
    joinedAt: { type: Date, default: Date.now },
    servedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

QueueEntrySchema.index({ salonId: 1, status: 1 });
QueueEntrySchema.index({ customerId: 1 });

export const QueueEntry = mongoose.model<IQueueEntry>('QueueEntry', QueueEntrySchema);
