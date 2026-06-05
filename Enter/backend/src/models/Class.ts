import mongoose, { Document, Schema } from 'mongoose';

export interface IClass extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  sections: string[];
  classTeacher: mongoose.Types.ObjectId;
}

const ClassSchema = new Schema<IClass>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true },
    sections: [{ type: String }],
    classTeacher: { type: Schema.Types.ObjectId, ref: 'Teacher' },
  },
  { timestamps: true }
);
ClassSchema.index({ schoolId: 1, name: 1 }, { unique: true });

export const Class = mongoose.model<IClass>('Class', ClassSchema);
