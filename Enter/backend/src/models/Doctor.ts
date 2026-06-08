import mongoose, { Document, Schema } from 'mongoose';

export interface IAvailableSlot {
  day: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isAvailable: boolean;
}

export interface IDoctor extends Document {
  hospitalId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  doctorId: string;
  name: string;
  qualification: string;
  specialization: string;
  experience: number;
  profileImage: string;
  fee: number;
  availableSlots: IAvailableSlot[];
  maxPatientsPerDay: number;
  currentPatientsToday: number;
  isAvailable: boolean;
  status: 'available' | 'busy' | 'offline' | 'on_leave';
  rating: number;
  totalRatings: number;
  about: string;
  createdAt: Date;
  updatedAt: Date;
}

const AvailableSlotSchema = new Schema(
  {
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDuration: { type: Number, default: 15 },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const DoctorSchema = new Schema<IDoctor>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    doctorId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    qualification: { type: String },
    specialization: { type: String, required: true },
    experience: { type: Number, default: 0 },
    profileImage: { type: String },
    fee: { type: Number, default: 0 },
    availableSlots: { type: [AvailableSlotSchema], default: [] },
    maxPatientsPerDay: { type: Number, default: 30 },
    currentPatientsToday: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['available', 'busy', 'offline', 'on_leave'],
      default: 'available',
    },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    about: { type: String },
  },
  { timestamps: true }
);

DoctorSchema.index({ hospitalId: 1 });
DoctorSchema.index({ departmentId: 1 });
// doctorId index removed — already unique:true on field definition
DoctorSchema.index({ specialization: 1 });

export const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);
