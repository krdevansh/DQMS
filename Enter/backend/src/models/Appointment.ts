import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  hospitalId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  date: string;
  timeSlot: string;
  status: 'booked' | 'waiting' | 'completed' | 'cancelled' | 'missed';
  queuePosition: number;
  estimatedWaitTime: number;
  actualWaitTime: number;
  complaint: string;
  notes: string;
  bookingType: 'online' | 'walk-in' | 'follow-up';
  isFollowUp: boolean;
  followUpFrom: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    appointmentId: { type: String, required: true, unique: true },
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ['booked', 'waiting', 'completed', 'cancelled', 'missed'],
      default: 'booked',
    },
    queuePosition: { type: Number, default: 0 },
    estimatedWaitTime: { type: Number, default: 0 },
    actualWaitTime: { type: Number, default: 0 },
    complaint: { type: String },
    notes: { type: String },
    bookingType: {
      type: String,
      enum: ['online', 'walk-in', 'follow-up'],
      default: 'online',
    },
    isFollowUp: { type: Boolean, default: false },
    followUpFrom: { type: Schema.Types.ObjectId, ref: 'Appointment' },
  },
  { timestamps: true }
);

AppointmentSchema.index({ hospitalId: 1, date: 1 });
AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.index({ doctorId: 1, date: 1 });
AppointmentSchema.index({ status: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
