import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaint extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: 'discipline' | 'academic' | 'behavior' | 'other';
  filedBy: mongoose.Types.ObjectId;
  filedByRole: 'teacher' | 'admin';
  status: 'open' | 'resolved' | 'dismissed';
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['discipline', 'academic', 'behavior', 'other'], default: 'other' },
    filedBy: { type: Schema.Types.ObjectId, required: true },
    filedByRole: { type: String, enum: ['teacher', 'admin'], required: true },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
