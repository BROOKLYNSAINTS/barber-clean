// firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  setDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID
} from '@env';

// ✅ Firebase config
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID
};

// ✅ Initialize Firebase only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Services
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// ✅ Auth helpers
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const registerUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const getUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};

export const createUserProfile = async (userId, profileData) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, profileData, { merge: true });
};

export const getBarbersByZipcode = async (zipcode) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', 'barber'), where('zipcode', '==', zipcode));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getBarberServices = async (barberId) => {
  const servicesRef = collection(db, 'users', barberId, 'services');
  const snapshot = await getDocs(servicesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getBarberAvailability = async (barberId, selectedDate) => {
  const docRef = doc(db, 'users', barberId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return [];

  const barber = docSnap.data();
  const { workingDays, workingHours, unavailableDates } = barber;
  if (!workingDays || !workingHours) return [];
  if (Array.isArray(unavailableDates) && unavailableDates.includes(selectedDate)) return [];

  const dateObj = new Date(selectedDate);
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  if (!workingDays[dayOfWeek]) return [];

  const slots = [];
  const [startHour, startMinute] = workingHours.start.split(':').map(Number);
  const [endHour, endMinute] = workingHours.end.split(':').map(Number);
  const interval = workingHours.interval || 30;

  let current = new Date(dateObj);
  current.setHours(startHour, startMinute, 0, 0);

  const end = new Date(dateObj);
  end.setHours(endHour, endMinute, 0, 0);

  while (current < end) {
    const timeStr = current.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    slots.push(timeStr);
    current.setMinutes(current.getMinutes() + interval);
  }

  return slots;
};

export const createAppointment = async (data) => {
  const docRef = await addDoc(collection(db, 'appointments'), {
    ...data,
    createdAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    ...data,
  };
};

export const getCustomerAppointments = async (customerId) => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('customerId', '==', customerId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching customer appointments:', error);
    return [];
  }
};
export const getBarberReviews = async (barberId) => {
  const reviewsRef = collection(db, 'users', barberId, 'reviews');
  const snapshot = await getDocs(reviewsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
export const getBarberRating = async (barberId) => {
  const reviews = await getBarberReviews(barberId);
  if (reviews.length === 0) return 0;

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return totalRating / reviews.length;
};
export const getBarberNotifications = async (barberId) => {
  const notificationsRef = collection(db, 'users', barberId, 'notifications');
  const snapshot = await getDocs(notificationsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
export const markNotificationAsRead = async (barberId, notificationId) => {
  const notifRef = doc(db, 'users', barberId, 'notifications', notificationId);
  await updateDoc(notifRef, { read: true });
};



export {
  app,
  auth,
  db,
  functions,
  onAuthStateChanged
  };
