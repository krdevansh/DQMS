import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';

let client: Client | null = null;
let isReady = false;
let qrDisplayed = false;

function getClient(): Client {
  if (!client) {
    client = new Client({
      authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
      puppeteer: { headless: true, args: ['--no-sandbox'] },
    });

    client.on('qr', (qr) => {
      qrDisplayed = true;
      console.log('\n═══════════════════════════════════════════');
      console.log('  SCAN THIS QR CODE WITH WHATSAPP ON YOUR PHONE');
      console.log('  Open WhatsApp → Menu → Linked Devices → Link a Device');
      console.log('═══════════════════════════════════════════\n');
      qrcode.generate(qr, { small: true });
      console.log('\nWaiting for scan...');
    });

    client.on('ready', () => {
      isReady = true;
      qrDisplayed = false;
      console.log('\n✓ WhatsApp client is ready and connected!\n');
    });

    client.on('authenticated', () => {
      console.log('✓ WhatsApp authenticated successfully');
    });

    client.on('auth_failure', (msg) => {
      console.error('✗ WhatsApp auth failure:', msg);
    });

    client.on('disconnected', (reason) => {
      isReady = false;
      console.log('WhatsApp disconnected:', reason);
    });

    client.initialize();
  }
  return client;
}

export function isClientReady(): boolean {
  return isReady;
}

export function hasQrDisplayed(): boolean {
  return qrDisplayed;
}

/**
 * Waits up to `timeoutMs` for the WhatsApp client to become ready.
 * Useful after server restarts where the client auto-reconnects using the saved session.
 */
export function waitForReady(timeoutMs = 20000): Promise<boolean> {
  if (isReady) return Promise.resolve(true);
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (isReady) {
        clearInterval(interval);
        resolve(true);
      }
    }, 500);
    setTimeout(() => {
      clearInterval(interval);
      resolve(isReady);
    }, timeoutMs);
  });
}

export async function sendWhatsAppOtp(phone: string, otp: string): Promise<void> {
  const waClient = getClient();

  if (!isReady) {
    throw new Error('WhatsApp client is not ready yet. Scan the QR code first.');
  }

  // whatsapp-web.js requires chatId as digits only, e.g. "918210896661@c.us" (no + sign)
  const digits = phone.replace(/\D/g, ''); // strip +, spaces, dashes
  const withCountryCode = digits.startsWith('91') ? digits : `91${digits}`;
  const chatId = `${withCountryCode}@c.us`;

  const message = `🔐 *DQMS Verification Code*\n\nYour OTP is: *${otp}*\n\nThis code expires in *10 minutes*.\nDo not share this code with anyone.`;

  await waClient.sendMessage(chatId, message);
}

export function initializeWhatsApp(): void {
  getClient();
}

export { getClient };
