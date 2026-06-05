import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  hospitalId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  recipientRole: 'hospital_admin' | 'doctor' | 'patient';
  type: 'appointment_confirmed' | 'appointment_reminder' | 'queue_update' | 'doctor_unavailable' | 'patient_called' | 'general';
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientRole: {
      type: String,
      enum: ['hospital_admin', 'doctor', 'patient'],
      required: true,
    },
    type: {
      type: String,
      enum: ['appointment_confirmed', 'appointment_reminder', 'queue_update', 'doctor_unavailable', 'patient_called', 'general'],
      default: 'general',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ hospitalId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
