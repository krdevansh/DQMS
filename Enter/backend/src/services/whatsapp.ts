import path from 'path';
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';

const SESSION_DIR = path.resolve(__dirname, '../../whatsapp-session');

let sock: any = null;
let isReady = false;
let latestQr: string | null = null;
let initStarted = false;

export function isClientReady(): boolean {
  return isReady;
}

export function getQr(): string | null {
  return latestQr;
}

export async function initWhatsApp(): Promise<void> {
  if (initStarted) return;
  initStarted = true;

  try {
    console.log(`WhatsApp session dir: ${SESSION_DIR}`);
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['DQMS', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          latestQr = await QRCode.toDataURL(qr, { width: 400, margin: 2 });
          console.log('QR code generated — visit /api/whatsapp-qr to scan');
        } catch (err) {
          console.error('Failed to generate QR image:', err);
        }
      }

      if (connection === 'open') {
        isReady = true;
        latestQr = null;
        console.log('✓ WhatsApp client is ready and connected!');
      }

      if (connection === 'close') {
        isReady = false;
        const loggedOut = (lastDisconnect?.error as any)?.output?.statusCode === DisconnectReason.loggedOut;
        if (loggedOut) {
          console.log('WhatsApp logged out. Delete the whatsapp-session folder and restart.');
        } else {
          console.log('WhatsApp disconnected, reconnecting...');
          initStarted = false;
          initWhatsApp();
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (err) {
    console.error('WhatsApp init error:', err);
    initStarted = false;
  }
}

export async function sendWhatsAppOtp(phone: string, otp: string): Promise<void> {
  if (!sock || !isReady) {
    throw new Error('WhatsApp client is not ready. Scan the QR code first.');
  }

  const digits = phone.replace(/\D/g, '');
  const withCountryCode = digits.startsWith('91') ? digits : `91${digits}`;
  const jid = `${withCountryCode}@s.whatsapp.net`;

  const message = `🔐 *DQMS Verification Code*\n\nYour OTP is: *${otp}*\n\nThis code expires in *10 minutes*.\nDo not share this code with anyone.`;

  await sock.sendMessage(jid, { text: message });
}
