import mongoose, { Document, Schema } from 'mongoose';

export interface IHospitalQueueEntry extends Document {
  hospitalId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  patientName: string;
  patientPhone: string;
  ticket: string;
  position: number;
  status: 'waiting' | 'with-doctor' | 'completed' | 'cancelled' | 'skipped';
  department: string;
  complaint: string;
  estimatedWaitMinutes: number;
  actualWaitMinutes: number;
  calledAt: Date;
  servedAt: Date;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HospitalQueueEntrySchema = new Schema<IHospitalQueueEntry>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
    patientName: { type: String, required: true },
    patientPhone: { type: String },
    ticket: { type: String, required: true },
    position: { type: Number, required: true },
    status: {
      type: String,
      enum: ['waiting', 'with-doctor', 'completed', 'cancelled', 'skipped'],
      default: 'waiting',
    },
    department: { type: String },
    complaint: { type: String },
    estimatedWaitMinutes: { type: Number, default: 0 },
    actualWaitMinutes: { type: Number, default: 0 },
    calledAt: { type: Date },
    servedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

HospitalQueueEntrySchema.index({ hospitalId: 1, status: 1 });
HospitalQueueEntrySchema.index({ doctorId: 1, status: 1 });
HospitalQueueEntrySchema.index({ appointmentId: 1 }, { unique: true, sparse: true });
HospitalQueueEntrySchema.index({ patientId: 1 });

export const HospitalQueueEntry = mongoose.model<IHospitalQueueEntry>('HospitalQueueEntry', HospitalQueueEntrySchema);
