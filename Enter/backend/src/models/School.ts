import mongoose, { Document, Schema } from 'mongoose';

export interface ISchool extends Document {
  name: string;
  code: string;
  schoolId: string;
  principalName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  email: string;
  logo: string;
  adminPin: string;
}

const SchoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    schoolId: { type: String, required: true, unique: true },
    principalName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String },
    logo: { type: String },
    adminPin: { type: String, required: true },
  },
  { timestamps: true }
);

export const School = mongoose.model<ISchool>('School', SchoolSchema);
