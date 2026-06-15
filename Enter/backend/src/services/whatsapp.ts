import path from 'path';
import pino from 'pino';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';

const SESSION_DIR = path.resolve(__dirname, '../../whatsapp-session');

let sock: any = null;
let isReady = false;
let latestQr: string | null = null;
let initStarted = false;
let reconnectAttempts = 0;

export function isClientReady(): boolean {
  return isReady;
}

export function getQr(): string | null {
  return latestQr;
}

function getReconnectDelay(): number {
  reconnectAttempts++;
  const base = Math.min(5000 * Math.pow(2, reconnectAttempts - 1), 120000);
  const jitter = Math.floor(Math.random() * 2000);
  return base + jitter;
}

function resetReconnectAttempts(): void {
  reconnectAttempts = 0;
}

export async function initWhatsApp(): Promise<void> {
  if (initStarted) return;
  initStarted = true;
  resetReconnectAttempts();

  try {
    console.log(`WhatsApp session dir: ${SESSION_DIR}`);
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    const logger = pino({ level: 'warn' });

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.windows('Chrome'),
      syncFullHistory: false,
      markOnlineOnConnect: false,
      logger,
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
        resetReconnectAttempts();
        console.log('✓ WhatsApp client is ready and connected!');
      }

      if (connection === 'close') {
        isReady = false;
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        const blocked = statusCode === DisconnectReason.badSession;

        console.log(`WhatsApp disconnected (reason: ${statusCode}). Reconnect attempt #${reconnectAttempts + 1}`);

        if (loggedOut) {
          console.log('WhatsApp logged out. Delete the whatsapp-session folder and restart.');
          initStarted = false;
        } else if (blocked) {
          console.log('WhatsApp session is bad. Delete the whatsapp-session folder and restart.');
          initStarted = false;
        } else {
          const delay = getReconnectDelay();
          console.log(`Reconnecting in ${Math.round(delay / 1000)}s...`);
          initStarted = false;
          setTimeout(() => initWhatsApp(), delay);
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
