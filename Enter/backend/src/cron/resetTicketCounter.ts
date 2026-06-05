import cron from 'node-cron';
import { Salon } from '../models/Salon';

export function startTicketCounterReset() {
  // Runs every day at 12:00 AM (midnight)
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await Salon.updateMany({}, { $set: { ticketCounter: 0 } });
      console.log(`[Cron] Reset ticketCounter to 0 for ${result.modifiedCount} salon(s)`);
    } catch (error) {
      console.error('[Cron] Ticket counter reset error:', error);
    }
  });

  console.log('[Cron] Ticket counter daily reset scheduled (daily at midnight)');
}
