import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const PORT = parseInt(process.env.PORT || '3002', 10);
const ADMIN_ID = process.env.ADMIN_ID || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const JWT_SECRET = process.env.JWT_SECRET || '';
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');
const MAIN_FRONTEND_URL = (process.env.MAIN_FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASS = (process.env.GMAIL_APP_PASS || '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASS },
});

interface OtpEntry {
  otp: string;
  expiresAt: number;
}
const otpStore = new Map<string, OtpEntry>();

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function sendOtpEmail(email: string, otp: string): Promise<unknown> {
  return transporter.sendMail({
    from: `"DQMS Admin" <${GMAIL_USER}>`,
    to: email,
    subject: 'DQMS Admin Login OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#111;color:#fff;padding:32px;border-radius:16px;border:1px solid #ffffff22">
        <div style="text-align:center;margin-bottom:24px">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,#2563EB,#7C3AED);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
            <span style="font-size:28px">🛡️</span>
          </div>
          <h1 style="font-size:20px;margin:0">DQMS Admin Login</h1>
        </div>
        <p style="color:#a0aec0;font-size:14px;margin-bottom:24px">Use the OTP below to complete your login. It expires in 5 minutes.</p>
        <div style="background:#1a1a1a;border-radius:12px;padding:20px;text-align:center;border:1px solid #ffffff11">
          <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#fff;font-family:monospace">${otp}</span>
        </div>
        <p style="color:#4a5568;font-size:12px;margin-top:24px;text-align:center">If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}

function servePage(res: Response, html: string): void {
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}

const LOGIN_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DQMS Admin Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background: #0A0A0A; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .bg-glow { position: fixed; inset: 0; pointer-events: none; }
    .bg-glow::before, .bg-glow::after { content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(140px); }
    .bg-glow::before { top: 25%; left: 25%; background: rgba(37,99,235,0.08); }
    .bg-glow::after { bottom: 25%; right: 25%; background: rgba(124,58,237,0.06); }
    .card { position: relative; width: 100%; max-width: 420px; background: #111; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 32px; box-shadow: 0 25px 50px rgba(0,0,0,0.6); }
    .icon-wrap { width: 64px; height: 64px; background: linear-gradient(135deg,#2563EB,#7C3AED); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 4px 24px rgba(37,99,235,0.25); }
    .icon-wrap svg { width: 32px; height: 32px; fill: none; stroke: #fff; stroke-width: 2; }
    h1 { color: #fff; font-size: 22px; text-align: center; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 13px; text-align: center; margin-bottom: 28px; }
    .field { margin-bottom: 16px; }
    label { display: block; color: #94a3b8; font-size: 13px; font-weight: 500; margin-bottom: 6px; }
    .input-wrap { position: relative; }
    .input-wrap svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; stroke: #475569; fill: none; stroke-width: 2; }
    input { width: 100%; background: #1A1A1A; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 11px 14px 11px 42px; color: #fff; font-size: 14px; outline: none; }
    input:focus { border-color: rgba(37,99,235,0.5); }
    input::placeholder { color: #475569; }
    .error { color: #f87171; font-size: 12px; margin-top: 4px; display: none; }
    button { width: 100%; padding: 12px; background: linear-gradient(135deg,#2563EB,#7C3AED); color: #fff; font-size: 15px; font-weight: 600; border: none; border-radius: 12px; cursor: pointer; margin-top: 8px; }
    button:hover { opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .footer { color: #475569; font-size: 11px; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="card">
    <div class="icon-wrap">
      <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    </div>
    <h1>Admin Portal</h1>
    <p class="subtitle">DQMS System Administration</p>
    <form method="POST" action="/login" onsubmit="document.getElementById('submit-btn').disabled=true;document.getElementById('submit-btn').innerHTML='Sending OTP...'">
      <div class="field">
        <label for="adminId">Admin ID</label>
        <div class="input-wrap">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>
          <input type="text" id="adminId" name="adminId" placeholder="Enter admin ID" required autocomplete="username">
        </div>
      </div>
      <div class="field">
        <label for="password">Password</label>
        <div class="input-wrap">
          <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <input type="password" id="password" name="password" placeholder="Enter password" required autocomplete="current-password">
        </div>
      </div>
      <p id="error" class="error"></p>
      <button type="submit" id="submit-btn">Send OTP to Email</button>
    </form>
    <p class="footer">Restricted to authorized administrators only</p>
  </div>
</body>
</html>`;

const VERIFY_PAGE = (error: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify OTP - DQMS Admin</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background: #0A0A0A; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .bg-glow { position: fixed; inset: 0; pointer-events: none; }
    .bg-glow::before, .bg-glow::after { content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(140px); }
    .bg-glow::before { top: 25%; left: 25%; background: rgba(37,99,235,0.08); }
    .bg-glow::after { bottom: 25%; right: 25%; background: rgba(124,58,237,0.06); }
    .card { position: relative; width: 100%; max-width: 420px; background: #111; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 32px; box-shadow: 0 25px 50px rgba(0,0,0,0.6); text-align: center; }
    .icon-wrap { width: 64px; height: 64px; background: linear-gradient(135deg,#2563EB,#7C3AED); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 4px 24px rgba(37,99,235,0.25); }
    .icon-wrap svg { width: 32px; height: 32px; fill: none; stroke: #fff; stroke-width: 2; }
    h1 { color: #fff; font-size: 22px; margin-bottom: 4px; }
    .subtitle { color: #94a3b8; font-size: 13px; margin-bottom: 8px; }
    .email-note { color: #64748b; font-size: 12px; margin-bottom: 24px; }
    .field { margin-bottom: 16px; }
    label { display: block; color: #94a3b8; font-size: 13px; font-weight: 500; margin-bottom: 6px; }
    input { width: 100%; background: #1A1A1A; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 11px 14px; color: #fff; font-size: 24px; letter-spacing: 8px; text-align: center; font-family: monospace; outline: none; }
    input:focus { border-color: rgba(37,99,235,0.5); }
    input::placeholder { font-size: 14px; letter-spacing: 0; color: #475569; }
    .error { color: #f87171; font-size: 12px; margin-top: 8px; ${error ? '' : 'display: none;'} }
    button { width: 100%; padding: 12px; background: linear-gradient(135deg,#2563EB,#7C3AED); color: #fff; font-size: 15px; font-weight: 600; border: none; border-radius: 12px; cursor: pointer; margin-top: 8px; }
    button:hover { opacity: 0.9; }
    .back-link { display: inline-block; margin-top: 20px; color: #64748b; font-size: 12px; text-decoration: none; }
    .back-link:hover { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="card">
    <div class="icon-wrap">
      <svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
    </div>
    <h1>Verify OTP</h1>
    <p class="subtitle">Check your email for the OTP</p>
    <p class="email-note">Sent to your registered email • Expires in 5 minutes</p>
    <form method="POST" action="/verify" onsubmit="document.getElementById('submit-btn').disabled=true;document.getElementById('submit-btn').innerHTML='Verifying...'">
      <input type="hidden" name="adminId" value="__ADMIN_ID__">
      <div class="field">
        <label for="otp">Enter 6-digit OTP</label>
        <input type="text" id="otp" name="otp" placeholder="000000" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" required autocomplete="one-time-code">
      </div>
      <p id="error" class="error">${error}</p>
      <button type="submit" id="submit-btn">Verify & Access Dashboard</button>
    </form>
    <a href="/" class="back-link">← Back to login</a>
  </div>
</body>
</html>`;

const COOKIE_NAME = 'dqms_admin_token';

function getTokenFromCookie(req: Request): string | undefined {
  return req.cookies?.[COOKIE_NAME];
}

function requireAuth(req: Request, res: Response, next: () => void): void {
  const token = getTokenFromCookie(req);
  if (!token) {
    return res.redirect('/');
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'admin') {
      return res.redirect('/');
    }
    (req as any).adminToken = token;
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    res.redirect('/');
  }
}

async function proxyToBackend(req: Request, res: Response): Promise<void> {
  const token = getTokenFromCookie(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const targetPath = req.originalUrl;
  const targetUrl = `${BACKEND_URL}${targetPath}`;

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: req.method === 'GET' || req.method === 'DELETE' ? undefined : JSON.stringify(req.body),
    });

    const data = await backendRes.json();
    res.status(backendRes.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Failed to reach backend' });
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/', (_req: Request, res: Response) => {
  servePage(res, LOGIN_PAGE);
});

app.post('/login', async (req: Request, res: Response) => {
  const { adminId, password } = req.body;

  if (!adminId || !password) {
    return servePage(res, LOGIN_PAGE.replace('id="error" class="error"', 'id="error" class="error" style="display:block"').replace('</p>', 'Admin ID and password are required</p>'));
  }

  if (adminId !== ADMIN_ID || password !== ADMIN_PASSWORD) {
    return servePage(res, LOGIN_PAGE.replace('id="error" class="error"', 'id="error" class="error" style="display:block"').replace('</p>', 'Invalid admin credentials</p>'));
  }

  const otp = generateOtp();
  otpStore.set(adminId, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

  try {
    await sendOtpEmail(GMAIL_USER, otp);
    servePage(res, VERIFY_PAGE('').replace('__ADMIN_ID__', adminId));
  } catch (err: any) {
    console.error('Email send error:', err?.message || err);
    otpStore.delete(adminId);
    const detail = err?.message?.includes('auth') ? 'Invalid GMAIL_USER or GMAIL_APP_PASS' : err?.message || 'Unknown error';
    servePage(res, LOGIN_PAGE.replace('id="error" class="error"', 'id="error" class="error" style="display:block"').replace('</p>', `Email failed: ${detail}</p>`));
  }
});

app.post('/verify', (req: Request, res: Response) => {
  const { adminId, otp } = req.body;

  if (!adminId || !otp) {
    return servePage(res, VERIFY_PAGE('OTP is required').replace('__ADMIN_ID__', adminId));
  }

  const entry = otpStore.get(adminId);
  if (!entry) {
    return servePage(res, VERIFY_PAGE('No OTP was requested. Please login again.').replace('__ADMIN_ID__', adminId));
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(adminId);
    return servePage(res, VERIFY_PAGE('OTP has expired. Please login again.').replace('__ADMIN_ID__', adminId));
  }

  if (entry.otp !== otp) {
    return servePage(res, VERIFY_PAGE('Invalid OTP. Please try again.').replace('__ADMIN_ID__', adminId));
  }

  otpStore.delete(adminId);

  const token = jwt.sign({ userId: 'admin', role: 'admin' }, JWT_SECRET, {
    expiresIn: '8h' as any,
  });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  });

  res.redirect('/dashboard');
});

app.get('/dashboard', requireAuth, (_req: Request, res: Response) => {
  res.render('dashboard');
});

app.get('/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect('/');
});

// Proxy admin API calls to backend
app.all('/api/admin/*', requireAuth, proxyToBackend);

app.listen(PORT, () => {
  console.log(`DQMS Admin Gateway running on http://localhost:${PORT}`);
});
