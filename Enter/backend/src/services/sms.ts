import twilio from 'twilio';
import { env } from '../config/env';

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export async function sendSmsOtp(phone: string, otp: string): Promise<void> {
  await client.messages.create({
    body: `Your DQMS verification code is: ${otp}. It expires in 10 minutes.`,
    from: env.TWILIO_PHONE_NUMBER,
    to: phone.startsWith('+') ? phone : `+91${phone}`,
  });
}
