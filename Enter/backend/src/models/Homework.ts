import mongoose, { Document, Schema } from 'mongoose';

export interface IHomework extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  section: string;
  subject: string;
  title: string;
  description: string;
  attachments: string[];
  deadline: string;
  uploadedBy: mongoose.Types.ObjectId;
}

const HomeworkSchema = new Schema<IHomework>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: String, required: true },
    subject: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    attachments: [{ type: String }],
    deadline: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  },
  { timestamps: true }
);

export const Homework = mongoose.model<IHomework>('Homework', HomeworkSchema);
