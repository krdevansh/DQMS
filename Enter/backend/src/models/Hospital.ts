import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkingHours {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

export interface IHospital extends Document {
  adminId: mongoose.Types.ObjectId;
  hospitalId: string;
  name: string;
  slug: string;
  logo: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  description: string;
  isOpen: boolean;
  isVerified: boolean;
  emergencyAvailable: boolean;
  latitude: number;
  longitude: number;
  location: { type: string; coordinates: number[] };
  hospitalImages: string[];
  workingHours: IWorkingHours[];
  openTime: string;
  closeTime: string;
  rating: number;
  totalRatings: number;
  createdAt: Date;
  updatedAt: Date;
}

const WorkingHoursSchema = new Schema(
  {
    day: { type: String, required: true },
    open: { type: String, required: true },
    close: { type: String, required: true },
    isOpen: { type: Boolean, default: true },
  },
  { _id: false }
);

const HospitalSchema = new Schema<IHospital>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hospitalId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logo: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    pincode: { type: String, required: true },
    description: { type: String },
    isOpen: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    emergencyAvailable: { type: Boolean, default: false },
    latitude: { type: Number },
    longitude: { type: Number },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    hospitalImages: { type: [String], default: [] },
    workingHours: { type: [WorkingHoursSchema], default: [] },
    openTime: { type: String, default: '09:00' },
    closeTime: { type: String, default: '18:00' },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

HospitalSchema.index({ slug: 1 }, { unique: true });
HospitalSchema.index({ pincode: 1 });
HospitalSchema.index({ city: 1 });
HospitalSchema.index({ location: '2dsphere' });
HospitalSchema.index({ adminId: 1 });

export const Hospital = mongoose.model<IHospital>('Hospital', HospitalSchema);
