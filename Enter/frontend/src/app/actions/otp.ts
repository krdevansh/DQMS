'use server';

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

export async function sendOtp(phone: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const json = await res.json();
    return json;
  } catch {
    return { success: false, message: 'Backend not reachable' };
  }
}
