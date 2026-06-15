import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceItem {
  name: string;
  price: number;
  completed: boolean;
}

export interface IQueueEntry extends Document {
  salonId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  ticket: string;
  position: number;
  serviceName: string;
  price: number;
  services: IServiceItem[];
  totalPrice: number;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';
  skipNote?: string;
  joinedAt: Date;
  servedAt?: Date;
  completedAt?: Date;
}

const ServiceItemSchema = new Schema<IServiceItem>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

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
    services: { type: [ServiceItemSchema], default: [] },
    totalPrice: { type: Number, default: 0 },
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
