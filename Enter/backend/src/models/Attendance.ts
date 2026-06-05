import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  section: string;
  date: string;
  records: { studentId: mongoose.Types.ObjectId; status: 'present' | 'absent' | 'leave' | 'late' }[];
  takenBy: mongoose.Types.ObjectId;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: String, required: true },
    date: { type: String, required: true },
    records: [{
      studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
      status: { type: String, enum: ['present', 'absent', 'leave', 'late'], required: true },
    }],
    takenBy: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  },
  { timestamps: true }
);
AttendanceSchema.index({ schoolId: 1, classId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
