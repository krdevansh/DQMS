import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  userId: mongoose.Types.ObjectId;
  patientId: string;
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  emergencyContact: { name: string; phone: string; relation: string };
  medicalHistory: { condition: string; diagnosedDate: string; notes: string }[];
  allergies: string[];
  profileImage: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyContactSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relation: { type: String, required: true },
  },
  { _id: false }
);

const MedicalHistoryEntrySchema = new Schema(
  {
    condition: { type: String, required: true },
    diagnosedDate: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

const PatientSchema = new Schema<IPatient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    dateOfBirth: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    emergencyContact: { type: EmergencyContactSchema },
    medicalHistory: { type: [MedicalHistoryEntrySchema], default: [] },
    allergies: { type: [String], default: [] },
    profileImage: { type: String },
  },
  { timestamps: true }
);

PatientSchema.index({ userId: 1 });
PatientSchema.index({ city: 1 });
PatientSchema.index({ pincode: 1 });

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
