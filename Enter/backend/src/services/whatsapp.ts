import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';

let client: Client | null = null;
let isReady = false;
let latestQr: string | null = null;

function getClient(): Client {
  if (!client) {
    client = new Client({
      authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
      puppeteer: { headless: true, args: ['--no-sandbox'] },
    });

    client.on('qr', (qr) => {
      latestQr = qr;
      console.log('\n═══════════════════════════════════════════');
      console.log('  SCAN THIS QR CODE WITH WHATSAPP ON YOUR PHONE');
      console.log('  Open WhatsApp → Menu → Linked Devices → Link a Device');
      console.log('═══════════════════════════════════════════\n');
      qrcode.generate(qr, { small: true });
      console.log('\nWaiting for scan...');
    });

    client.on('ready', () => {
      isReady = true;
      latestQr = null;
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

export function getQr(): string | null {
  return latestQr;
}

export function initWhatsApp(): void {
  getClient();
}

export async function sendWhatsAppOtp(phone: string, otp: string): Promise<void> {
  const waClient = getClient();

  if (!isReady) {
    throw new Error('WhatsApp client is not ready. Scan the QR code first.');
  }

  const digits = phone.replace(/\D/g, '');
  const withCountryCode = digits.startsWith('91') ? digits : `91${digits}`;
  const chatId = `${withCountryCode}@c.us`;

  const message = `🔐 *DQMS Verification Code*\n\nYour OTP is: *${otp}*\n\nThis code expires in *10 minutes*.\nDo not share this code with anyone.`;

  await waClient.sendMessage(chatId, message);
}
