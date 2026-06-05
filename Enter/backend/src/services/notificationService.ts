import { Notification } from '../models/Notification';
import mongoose from 'mongoose';

// Create a notification
export async function createNotification(data: {
  hospitalId: string;
  recipientId: string;
  recipientRole: 'hospital_admin' | 'doctor' | 'patient';
  type: 'appointment_confirmed' | 'appointment_reminder' | 'queue_update' | 'doctor_unavailable' | 'patient_called' | 'general';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  const notification = new Notification({
    hospitalId: new mongoose.Types.ObjectId(data.hospitalId),
    recipientId: new mongoose.Types.ObjectId(data.recipientId),
    recipientRole: data.recipientRole,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data || {},
  });
  await notification.save();
  return notification;
}

// Get notifications for a user
export async function getUserNotifications(recipientId: string, recipientRole: string, page = 1, limit = 20) {
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipientId: new mongoose.Types.ObjectId(recipientId), recipientRole })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ recipientId: new mongoose.Types.ObjectId(recipientId), recipientRole }),
    Notification.countDocuments({ recipientId: new mongoose.Types.ObjectId(recipientId), recipientRole, isRead: false }),
  ]);
  return { notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) };
}

// Mark notification as read
export async function markAsRead(notificationId: string) {
  return Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
}

// Mark all notifications as read
export async function markAllAsRead(recipientId: string, recipientRole: string) {
  return Notification.updateMany(
    { recipientId: new mongoose.Types.ObjectId(recipientId), recipientRole, isRead: false },
    { isRead: true }
  );
}
