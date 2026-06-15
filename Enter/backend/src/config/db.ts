import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Drop old global unique index on phone (migrated to compound phone+role index)
    const db = mongoose.connection.db;
    if (db) {
      const userCol = db.collection('users');
      const indexes = await userCol.indexes();
      const phoneIndex = indexes.find((i: any) => i.key?.phone === 1 && i.unique && i.key?.role === undefined);
      if (phoneIndex?.name) {
        await userCol.dropIndex(phoneIndex.name);
        console.log('Dropped old unique index on phone — using compound phone+role index');
      }
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err);
  });
}
