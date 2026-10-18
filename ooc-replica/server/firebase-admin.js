import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export const adminConfigured = env => Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
export function normalizePrivateKey(input){
 let value=String(input||'').trim();
 if(value.startsWith('\"')){try{const parsed=JSON.parse(value);if(typeof parsed==='string')value=parsed;}catch{}}
 return value.replace(/\\r\\n/g,'\n').replace(/\\n/g,'\n').replace(/\r\n/g,'\n').trim();
}
export function firebaseServices(env = process.env) {
  if (!adminConfigured(env)) throw Error('Firebase Admin is not configured');
  const name = `replica-${env.FIREBASE_PROJECT_ID}`;
  const app = getApps().find(a => a.name === name) || initializeApp({
    projectId: env.FIREBASE_PROJECT_ID,
    credential: cert({ projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL.trim(), privateKey: normalizePrivateKey(env.FIREBASE_PRIVATE_KEY) }),
  }, name);
  return { auth: getAuth(app), db: getFirestore(app) };
}
