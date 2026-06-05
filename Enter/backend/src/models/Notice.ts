import mongoose, { Document, Schema } from 'mongoose';

export interface INotice extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  attachments: string[];
  type: 'holiday' | 'exam' | 'event' | 'general' | 'emergency';
  targetClasses: mongoose.Types.ObjectId[];
  postedBy: mongoose.Types.ObjectId;
  postedByRole: 'admin' | 'teacher';
}

const NoticeSchema = new Schema<INotice>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    attachments: [{ type: String }],
    type: { type: String, enum: ['holiday', 'exam', 'event', 'general', 'emergency'], default: 'general' },
    targetClasses: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    postedBy: { type: Schema.Types.ObjectId, required: true },
    postedByRole: { type: String, enum: ['admin', 'teacher'], required: true },
  },
  { timestamps: true }
);

export const Notice = mongoose.model<INotice>('Notice', NoticeSchema);
