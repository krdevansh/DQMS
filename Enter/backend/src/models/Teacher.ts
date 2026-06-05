import mongoose, { Document, Schema } from 'mongoose';

export interface ITeacher extends Document {
  schoolId: mongoose.Types.ObjectId;
  teacherId: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  assignedClass: mongoose.Types.ObjectId;
  isClassTeacher: boolean;
  pin: string;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    teacherId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    subjects: [{ type: String }],
    assignedClass: { type: Schema.Types.ObjectId, ref: 'Class' },
    isClassTeacher: { type: Boolean, default: false },
    pin: { type: String, required: true },
  },
  { timestamps: true }
);
TeacherSchema.index({ schoolId: 1, teacherId: 1 }, { unique: true });

export const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema);
