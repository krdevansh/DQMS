import admin from 'firebase-admin';
import { env } from '../config/env';

let app: admin.app.App | null = null;

function getApp(): admin.app.App {
  if (!app) {
    if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
      app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
      app = admin.initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
    }
  }
  return app;
}

export function isFirebaseConfigured(): boolean {
  return !!(env.FIREBASE_SERVICE_ACCOUNT_KEY || env.FIREBASE_PROJECT_ID);
}

export async function verifyPhoneToken(idToken: string): Promise<{ phone: string; uid: string }> {
  const decoded = await getApp().auth().verifyIdToken(idToken);
  if (!decoded.phone_number) {
    throw new Error('Token does not contain a phone number');
  }
  return { phone: decoded.phone_number, uid: decoded.uid };
}
