import cron from 'node-cron';
import { Subscription } from '../models/Subscription';

export function startSubscriptionExpiryCheck() {
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      const result = await Subscription.updateMany(
        { status: 'active', endDate: { $lte: now } },
        { $set: { status: 'expired' } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Cron] Expired ${result.modifiedCount} subscription(s)`);
      }
    } catch (error) {
      console.error('[Cron] Subscription expiry check error:', error);
    }
  });

  console.log('[Cron] Subscription expiry check scheduled (daily at midnight)');
}
