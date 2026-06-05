import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  section: string;
  admissionNumber: string;
  name: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  phone: string;
  address: string;
  bloodGroup: string;
  isActive: boolean;
}

const StudentSchema = new Schema<IStudent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: String, required: true },
    admissionNumber: { type: String, required: true },
    name: { type: String, required: true },
    fatherName: { type: String },
    motherName: { type: String },
    dob: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    phone: { type: String },
    address: { type: String },
    bloodGroup: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
StudentSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true });
StudentSchema.index({ schoolId: 1, classId: 1 });

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
