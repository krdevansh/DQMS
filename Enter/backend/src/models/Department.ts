import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  hospitalId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DepartmentSchema.index({ hospitalId: 1 });
DepartmentSchema.index({ hospitalId: 1, name: 1 }, { unique: true });

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);
