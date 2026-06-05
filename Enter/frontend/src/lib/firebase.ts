import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, PhoneAuthProvider, RecaptchaVerifier } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function createRecaptchaVerifier(
  containerOrId: string | HTMLElement,
  auth: Auth
): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerOrId, {
    size: 'invisible',
    callback: () => {},
  });
}

export { PhoneAuthProvider, RecaptchaVerifier };
