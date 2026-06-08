import mongoose, { Document, Schema } from 'mongoose';

export interface IService {
  id: string;
  name: string;
  price: number;
  duration: string;
}

export interface IMember {
  name: string;
  specialization: string;
  experience: string;
  image?: string;
}

export interface ISalon extends Document {
  ownerId: mongoose.Types.ObjectId;
  shopNumber: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  description: string;
  salonType: 'male' | 'female' | 'unisex';
  isOpen: boolean;
  isVerified: boolean;
  rating: number;
  reviews: number;
  lat: number;
  lng: number;
  services: IService[];
  members: IMember[];
  image: string;
  ticketCounter: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true },
  },
  { _id: false }
);

const MemberSchema = new Schema<IMember>(
  {
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: String, required: true },
    image: { type: String },
  },
  { _id: false }
);

const SalonSchema = new Schema<ISalon>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shopNumber: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    description: { type: String },
    salonType: { type: String, enum: ['male', 'female', 'unisex'], default: 'unisex' },
    isOpen: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    lat: { type: Number },
    lng: { type: Number },
    services: [ServiceSchema],
    members: [MemberSchema],
    image: { type: String },
    ticketCounter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SalonSchema.index({ ownerId: 1 });
SalonSchema.index({ pincode: 1 });
SalonSchema.index({ city: 1 });
SalonSchema.index({ slug: 1 }, { unique: true });
SalonSchema.index({ shopNumber: 1 }, { unique: true });

export const Salon = mongoose.model<ISalon>('Salon', SalonSchema);
