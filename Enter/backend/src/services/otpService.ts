import { env } from '../config/env';

export function isOtpServiceConfigured(): boolean {
  return !!env.FAST2SMS_API_KEY;
}

export async function sendOtpViaFast2SMS(phone: string, otp: string): Promise<void> {
  if (!env.FAST2SMS_API_KEY) {
    throw new Error('FAST2SMS_API_KEY is not set in environment variables.');
  }

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

  console.log('[Fast2SMS] Response:', JSON.stringify(data));

  if (!response.ok || data?.return === false) {
    const detail = Array.isArray(data?.message)
      ? data.message.join(', ')
      : JSON.stringify(data);
    throw new Error(`Fast2SMS error: ${detail}`);
  }

  console.log(`[Fast2SMS] OTP sent to ${tenDigit} | Request ID: ${data?.request_id}`);
}
