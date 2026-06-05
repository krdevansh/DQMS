import mongoose, { Document, Schema } from 'mongoose';

export interface IMark extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  section: string;
  studentId: mongoose.Types.ObjectId;
  subject: string;
  examType: string;
  marksObtained: number;
  totalMarks: number;
  grade: string;
  term: string;
  academicYear: string;
}

const MarkSchema = new Schema<IMark>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: String, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: { type: String, required: true },
    examType: { type: String, required: true },
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    grade: { type: String },
    term: { type: String },
    academicYear: { type: String },
  },
  { timestamps: true }
);
MarkSchema.index({ schoolId: 1, studentId: 1, subject: 1, term: 1 });

export const Mark = mongoose.model<IMark>('Mark', MarkSchema);
