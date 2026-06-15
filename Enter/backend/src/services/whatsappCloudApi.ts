import { env } from '../config/env';

/**
 * Fast2SMS — Free SMS OTP delivery for Indian numbers (+91).
 * 100% free to start, no credit card, just an API key.
 * Sign up at: https://www.fast2sms.com
 *
 * Required env var (add on Render):
 *   FAST2SMS_API_KEY  — from fast2sms.com dashboard
 */

export function isWhatsAppCloudConfigured(): boolean {
  return !!env.FAST2SMS_API_KEY;
}

export async function sendOtpViaWhatsApp(phone: string, otp: string): Promise<void> {
  if (!env.FAST2SMS_API_KEY) {
    throw new Error('FAST2SMS_API_KEY is not set in environment variables.');
  }

  // Strip country code — Fast2SMS needs 10-digit Indian number
  const digits = phone.replace(/\D/g, '');
  const tenDigit = digits.startsWith('91') && digits.length === 12
    ? digits.slice(2)
    : digits;

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: env.FAST2SMS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'otp',
      variables_values: otp,
      flash: 0,
      numbers: tenDigit,
    }),
  });

  const data = await response.json() as any;

  if (!response.ok || data?.return === false) {
    const detail = data?.message?.join(', ') ?? JSON.stringify(data);
    throw new Error(`Fast2SMS error: ${detail}`);
  }

  console.log(`[Fast2SMS] OTP sent to ${tenDigit} | Request ID: ${data?.request_id}`);
}
