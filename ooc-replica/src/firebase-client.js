import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence, onAuthStateChanged, GoogleAuthProvider, OAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
export async function connectFirebase(config) {
  const app = initializeApp(config), auth = getAuth(app), db = getFirestore(app);
  await setPersistence(auth, browserLocalPersistence);
  return {
    subscribe: changed => onAuthStateChanged(auth, changed),
    login(provider) {
      const p = provider === 'apple' ? new OAuthProvider('apple.com') : new GoogleAuthProvider();
      if (provider === 'apple') { p.addScope('email'); p.addScope('name'); }
      else p.setCustomParameters({ prompt: 'select_account' });
      return signInWithPopup(auth, p);
    },
    logout: () => signOut(auth),
    async load(uid) {
      const snapshot = await getDocs(collection(db, 'users', uid, 'state'));
      return snapshot.docs.map(d => [d.id, JSON.parse(d.data().json)]);
    },
    save(uid, key, value) {
      return setDoc(doc(db, 'users', uid, 'state', key), { json: JSON.stringify(value), updatedAt: serverTimestamp() });
    },
  };
}
