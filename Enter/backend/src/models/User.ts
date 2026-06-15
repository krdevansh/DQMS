import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  salonName?: string;
  email?: string;
  phone: string;
  pin: string;
  role: 'customer' | 'salon' | 'hospital_admin' | 'doctor' | 'patient';
  faceShape?: string;
  gender?: string;
  profilePic?: string;
  trialStartDate?: Date;
  trialEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, trim: true },
    salonName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true },
    pin: { type: String, required: true },
    role: { type: String, enum: ['customer', 'salon', 'hospital_admin', 'doctor', 'patient'], required: true },
    faceShape: { type: String },
    gender: { type: String },
    profilePic: { type: String },
    trialStartDate: { type: Date },
    trialEndDate: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ phone: 1, role: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', UserSchema);
