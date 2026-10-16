import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export const adminConfigured = env => Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
export function firebaseServices(env = process.env) {
  if (!adminConfigured(env)) throw Error('Firebase Admin is not configured');
  const name = `replica-${env.FIREBASE_PROJECT_ID}`;
  const app = getApps().find(a => a.name === name) || initializeApp({
    projectId: env.FIREBASE_PROJECT_ID,
    credential: cert({ projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }),
  }, name);
  return { auth: getAuth(app), db: getFirestore(app) };
}
