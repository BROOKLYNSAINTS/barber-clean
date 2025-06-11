// delete-services-field.js
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, updateDoc, deleteField } from 'firebase/firestore';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} from './.env.js'; // Only works if exported directly or hardcoded

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// 👇 Replace with the actual user ID
const userId = 'REPLACE_WITH_ACTUAL_USER_ID';

(async () => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      services: deleteField(),
    });
    console.log(`✅ Deleted the 'services' field from user ${userId}`);
  } catch (e) {
    console.error('❌ Failed to delete field:', e);
  }
})();
