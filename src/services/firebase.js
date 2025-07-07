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
  serverTimestamp,
  updateDoc,
  deleteDoc
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

// Update a user's profile
export const updateUserProfile = async (userId, updatedData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, updatedData, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
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

  const services = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  console.log("📦 Full Service Data:", services);
  return services;
};

export const getBarberAvailability = async (barberId, selectedDate) => {
  const docRef = doc(db, 'users', barberId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return [];

  const barber = docSnap.data();
  const { workingDays, workingHours, unavailableDates } = barber;
  if (!workingDays || !workingHours) return [];
  if (Array.isArray(unavailableDates) && unavailableDates.includes(selectedDate)) return [];

  // Safely parse selectedDate as local date to avoid UTC shift bug
  if (!selectedDate || typeof selectedDate !== 'string' || !selectedDate.includes('-')) return [];
  const [year, month, day] = selectedDate.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return [];

  const dateObj = new Date(year, month - 1, day);

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
// Get a single appointment by its ID
export const getBarberAppointments = async (appointmentId) => {
  try {
    const apptRef = doc(db, 'appointments', appointmentId);
    const apptSnap = await getDoc(apptRef);
    console.log("Current UID:", auth.currentUser?.uid);
    if (!apptSnap.exists()) return null;
    return { id: apptSnap.id, ...apptSnap.data() };
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return null;
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

// Get all bulletins posts
export const getBulletinPosts = async () => {
  try {
    const postsRef = collection(db, 'bulletins');
    const snapshot = await getDocs(postsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching bulletin posts:', error);
    return [];
  }
};

// Add a new service for a barber
export const addBarberService = async (barberId, serviceData) => {
  try {
    const servicesRef = collection(db, 'users', barberId, 'services');
    const docRef = await addDoc(servicesRef, serviceData);
    return { id: docRef.id, ...serviceData };
  } catch (error) {
    console.error('Error adding barber service:', error);
    throw error;
  }
};

// Create a new bulletin post
export const createBulletinPost = async (postData) => {
  try {
    const postsRef = collection(db, 'bulletins'); // ✅ fixed collection name
    const docRef = await addDoc(postsRef, postData);
    return { id: docRef.id, ...postData };
  } catch (error) {
    console.error('Error creating bulletin post:', error);
    throw error;
  }
};

// Get a single bulletin post by its ID
export const getBulletinPostDetails = async (postId) => {
  try {
    const postRef = doc(db, 'bulletins', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return null;
    return { id: postSnap.id, ...postSnap.data() };
  } catch (error) {
    console.error('Error fetching bulletin post details:', error);
    return null;
  }
};

// Add a comment to a bulletin post
export const addCommentToBulletinPost = async (postId, commentData) => {
  try {
    const commentsRef = collection(db, 'bulletins', postId, 'comments');
    const docRef = await addDoc(commentsRef, commentData);
    return { id: docRef.id, ...commentData };
  } catch (error) {
    console.error('Error adding comment to bulletin post:', error);
    throw error;
  }
};

export const addCommentToPost = async (postId, commentText) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const comment = {
    text: commentText,
    authorId: user.uid,
    authorName: user.displayName || 'Anonymous',
    createdAt: new Date().toISOString(),
  };

  const commentsRef = collection(db, 'bulletins', postId, 'comments');
  const docRef = await addDoc(commentsRef, comment);
  return { id: docRef.id, ...comment };
};

// Cancel appointment by updating status or deleting
export const cancelAppointment = async (appointmentId, userId) => {
  try {
    console.log('Cancelling appointment:', appointmentId);
    const appointmentRef = doc(db, 'appointments', appointmentId);
    
    // Option 1: Update status to cancelled (preserves data)
    await updateDoc(appointmentRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledBy: userId
    });
    
    console.log('✅ Appointment cancelled successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error cancelling appointment:', error);
    throw error;
  }
};

// Delete appointment completely (if you prefer to remove it entirely)
export const deleteAppointment = async (appointmentId) => {
  try {
    console.log('Deleting appointment:', appointmentId);
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await deleteDoc(appointmentRef);
    
    console.log('✅ Appointment deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting appointment:', error);
    throw error;
  }
};

export {
  app,
  auth,
  db,
  functions,
  onAuthStateChanged
  };
