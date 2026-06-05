import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  salonId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    salonId: { type: Schema.Types.ObjectId, ref: 'Salon', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    serviceName: { type: String, required: true },
    price: { type: Number, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ['confirmed', 'completed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

BookingSchema.index({ salonId: 1 });
BookingSchema.index({ customerId: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
