// firebase.js
console.log('Firebase services loading...');
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,        // ADD THIS
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  setLogLevel,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import getFirebaseConfig from './firebaseEnvironment';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Config
const firebaseConfig = getFirebaseConfig();

// App
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth (RN-safe: try initializeAuth once, else getAuth)
let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  auth = getAuth(app);
}
export { auth };

// Firestore/Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// Firestore logging (errors only)
setLogLevel('error');

// ========= Auth helpers =========
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const registerUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// ========= User profile =========
export const getUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};

export const createUserProfile = async (userId, profileData) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, profileData, { merge: true });
};

export const updateUserProfile = async (userId, updatedData) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, updatedData, { merge: true });
  return true;
};

// ========= Discovery =========
export const getBarbersByZipcode = async (zipcode) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', 'barber'), where('zipcode', '==', zipcode));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getBarberServices = async (barberId) => {
  const servicesRef = collection(db, 'users', barberId, 'services');
  const snapshot = await getDocs(servicesRef);
  return snapshot.docs.map(d => {
    const data = d.data() || {};
    const priceNum = Number(data.price);
    const durationNum = Number(data.duration);
    return {
      id: d.id,
      name: data.name || 'Service',
      price: Number.isFinite(priceNum) ? priceNum : null,
      duration: Number.isFinite(durationNum) ? durationNum : null,
      photoUrl: data.photoUrl || null,
    };
  });
};

// Keep availability authoritative and remove consumed slots by duration
export const bookAppointmentAndUpdateAvailability = async ({
  barberId,
  customerId,
  customerName,
  serviceId, 
  serviceName,
  price,
  duration,
  date,
  time,
  barberName,
}) => {
  const userRef = doc(db, 'users', barberId);
  const apptRef = doc(collection(db, 'appointments'));
  
  const durNum = Number(duration);
  const priceNum = Number(price);

  await runTransaction(db, async (tx) => {
    // Get barber document
    const barberSnap = await tx.get(userRef);
    if (!barberSnap.exists()) throw new Error('Barber not found');
    const barberData = barberSnap.data() || {};
    
    // Get current availability
    const availability = barberData.availability || {};
    const daySlots = availability[date] || [];
    
    if (!daySlots.length) throw new Error('No availability for selected date');
    
    // IMPROVED TIME HANDLING: Convert from "4:30 P.M." to "16:30" with robust parsing
    const time24 = (() => {
      const match = time.match(/(\d{1,2}):(\d{2})\s*([AaPp]\.?[Mm]\.?)/);
      if (!match) return null;
      
      let [_, hours, minutes, period] = match;
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);
      
      if (period.toLowerCase().includes('p') && hours !== 12) {
        hours += 12;
      }
      if (period.toLowerCase().includes('a') && hours === 12) {
        hours = 0;
      }
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    })();

    console.log('TRANSACTION TIMES:', {
      displayTime: time, 
      time24: time24,
      daySlots: daySlots, 
      foundExact: daySlots.includes(time24)
    });
    
    // Check if selected time slot exists
    if (!time24 || !daySlots.includes(time24)) {
      throw new Error('Selected time is no longer available');
    }
    
    // Calculate how many slots this appointment needs based on duration
    const intervalMinutes = 30; // Standard interval
    const slotsNeeded = Math.ceil(durNum / intervalMinutes);
    
    // Convert time to minutes for slot calculation
    const timeToMinutes = (t) => {
      const [hours, minutes] = t.split(':').map(Number);
      return (hours * 60) + minutes;
    };
    
    // Convert minutes back to time format
    const minutesToTime = (minutes) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    
    // Identify all slots to remove
    const startTimeMinutes = timeToMinutes(time24);
    const slotsToRemove = [];
    
    for (let i = 0; i < slotsNeeded; i++) {
      const slotTime = minutesToTime(startTimeMinutes + (i * intervalMinutes));
      if (!daySlots.includes(slotTime)) {
        console.log(`Missing required slot ${slotTime} for duration ${durNum}min`);
        throw new Error(`Not enough consecutive time slots available for this service duration`);
      }
      slotsToRemove.push(slotTime);
    }
    
    console.log('Will remove slots:', slotsToRemove);
    
    // Filter out the slots we're removing
    const updatedSlots = daySlots.filter(slot => !slotsToRemove.includes(slot));
    
    // Update the availability or remove the date if no slots remain
    if (updatedSlots.length > 0) {
      availability[date] = updatedSlots;
    } else {
      delete availability[date];
    }
    
    // Update barber's availability
    tx.update(userRef, { availability });
    
    // Create the appointment
    tx.set(apptRef, {
      id: apptRef.id,
      barberId,
      barberName: barberName || barberData.name || '',
      barberPhone: barberData.phone || '',
      barberAddress: barberData.address || '',
      customerId,
      customerName,
      serviceId,
      serviceName,
      servicePrice: Number.isFinite(priceNum) ? priceNum : 0,
      price: Number.isFinite(priceNum) ? priceNum : 0,
      duration: durNum,
      date,
      time,
      time24,
      slotsBooked: slotsToRemove, // Store which slots were booked
      createdAt: serverTimestamp(),
    });
  });

  return { id: apptRef.id };
};

// Helper function: Convert time (HH:MM) to minutes since midnight
function timeToMinutes(time) {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

// Helper function: Convert minutes since midnight to time (HH:MM)
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Normalize time to 24h format (HH:MM)
function normalizeTimeTo24h(raw = '') {
  const s = String(raw).replace(/[\u202F\u00A0]/g, ' ').trim();
  const cleaned = s.replace(/([AaPp])\.?\s*[Mm]\.?/g, (m, a) => ` ${a.toUpperCase()}M`).trim();
  const parts = cleaned.split(' ');
  const hhmm = parts[0] || '';
  const ampm = (parts[1] || '').toUpperCase(); // AM | PM | ''
  let [h, m] = hhmm.split(':');
  if (h == null) return '';
  if (m == null) m = '00';
  let hour = parseInt(h, 10);
  const min = parseInt(m, 10);
  if (Number.isNaN(hour) || Number.isNaN(min)) return '';
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// ========= Appointments =========
export async function createAppointment(data) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be logged in to book an appointment');
  if (!data.barberId) throw new Error('Barber information is missing');

  const completeAppointment = {
    barberId: data.barberId,
    customerId: currentUser.uid,
    date: data.date,
    time: data.time,
    start: data.start,
    status: 'pending',
    createdAt: serverTimestamp(),
    serviceId: data.serviceId || null,
    serviceName: data.serviceName || null,
    customerName: data.customerName || null,
    barberName: data.barberName || null,
    price: data.price || null
  };

  const ref = await addDoc(collection(db, 'appointments'), completeAppointment);
  return { id: ref.id, ...completeAppointment };
}

export const getAppointmentsByBarber = async (barberId) => {
  if (!barberId) return [];
  const qRef = query(collection(db, 'appointments'), where('barberId', '==', barberId));
  const snap = await getDocs(qRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getTodaysAppointmentsForBarber = async (barberId) => {
  if (!barberId) return [];
  const today = new Date().toISOString().split('T')[0];
  const qRef = query(
    collection(db, 'appointments'),
    where('barberId', '==', barberId),
    where('date', '==', today)
  );
  const snap = await getDocs(qRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getCustomerAppointments = async (customerId) => {
  if (!customerId) return [];
  const q = query(collection(db, 'appointments'), where('customerId', '==', customerId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAppointmentById = async (appointmentId) => {
  const ref = doc(db, 'appointments', appointmentId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getAppointmentByIdIfParticipant = async (appointmentId) => {
  const uid = auth.currentUser?.uid;
  const ref = doc(db, 'appointments', appointmentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.customerId !== uid && data.barberId !== uid) {
    throw new Error('Not authorized to read this appointment');
  }
  return { id: snap.id, ...data };
};

export const cancelAppointment = async (appointmentId, userId) => {
  const ref = doc(db, 'appointments', appointmentId);
  await updateDoc(ref, { status: 'cancelled', cancelledAt: serverTimestamp(), cancelledBy: userId });
  return { success: true };
};

export const deleteAppointment = async (appointmentId) => {
  const ref = doc(db, 'appointments', appointmentId);
  await deleteDoc(ref);
  return { success: true };
};

export const getLastAppointmentForUser = async (customerId) => {
  const qRef = query(
    collection(db, 'appointments'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(qRef);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const getAppointmentByDateTime = async (userId, date, time) => {
  const qRef = query(
    collection(db, 'appointments'),
    where('customerId', '==', userId),
    where('date', '==', date),
    where('time', '==', time)
  );
  const snap = await getDocs(qRef);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
};

export const getAppointmentsForUserDate = async (userId, date) => {
  const qRef = query(
    collection(db, 'appointments'),
    where('customerId', '==', userId),
    where('date', '==', date)
  );
  const snap = await getDocs(qRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const listAllUserAppointments = async (userId) => {
  const qRef = query(collection(db, 'appointments'), where('customerId', '==', userId));
  const snap = await getDocs(qRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export async function getRecentAppointmentsForUser(userId, count = 3) {
  if (!userId) return [];
  const qRef = query(
    collection(db, 'appointments'),
    where('customerId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  const snap = await getDocs(qRef);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
    };
  });
};

// ========= Reviews / Ratings =========
export const getBarberReviews = async (barberId) => {
  const reviewsRef = collection(db, 'users', barberId, 'reviews');
  const snap = await getDocs(query(reviewsRef, orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const createReview = async (barberId, { rating, text, customerName }) => {
  if (!auth.currentUser?.uid) throw new Error('Not signed in');
  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) throw new Error('Rating must be 1–5');

  const ref = collection(db, 'users', barberId, 'reviews');
  const docRef = await addDoc(ref, {
    authorId: auth.currentUser.uid,
    customerName: customerName || auth.currentUser.email || 'Anonymous',
    rating: r,
    text: String(text || '').trim(),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// ========= Notifications =========
export const getBarberNotifications = async (barberId) => {
  const ref = collection(db, 'users', barberId, 'notifications');
  const snap = await getDocs(ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const markNotificationAsRead = async (barberId, notificationId) => {
  const ref = doc(db, 'users', barberId, 'notifications', notificationId);
  await updateDoc(ref, { read: true });
};

// ========= Bulletins =========
export const getBulletinPosts = async () => {
  const ref = collection(db, 'bulletins');
  const snap = await getDocs(ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const createBulletinPost = async (postData) => {
  const ref = collection(db, 'bulletins');
  const docRef = await addDoc(ref, postData);
  return { id: docRef.id, ...postData };
};

export const getBulletinPostDetails = async (postId) => {
  const ref = doc(db, 'bulletins', postId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const addCommentToBulletinPost = async (postId, commentData) => {
  const ref = collection(db, 'bulletins', postId, 'comments');
  const docRef = await addDoc(ref, commentData);
  return { id: docRef.id, ...commentData };
};

export const addCommentToPost = async (postId, commentText) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const comment = {
    text: commentText,
    authorId: user.uid,
    authorName: user.displayName || 'Anonymous',
    createdAt: new Date().toISOString()
  };
  const ref = collection(db, 'bulletins', postId, 'comments');
  const docRef = await addDoc(ref, comment);
  return { id: docRef.id, ...comment };
};

// ========= Stripe helpers =========
export const storeStripeAccountId = async (barberId, stripeAccountId) => {
  const userRef = doc(db, 'users', barberId);
  await updateDoc(userRef, {
    stripeAccountId,
    stripeAccountCreatedAt: serverTimestamp(),
    stripeAccountEnabled: false
  });
  return true;
};

export const getStripeAccountId = async (barberId) => {
  const userRef = doc(db, 'users', barberId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) return null;
  const data = userDoc.data();
  return data.stripeAccountId || null;
};

export const updateStripeConnectStatus = async (userId) => {
  const BACKEND_URL = process.env.EXPO_PUBLIC_STRIPE_BACKEND_URL;
  const bypassSecret = process.env.EXPO_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET;
  const res = await fetch(
    `${BACKEND_URL}/check-account-status?barberId=${userId}&x-vercel-protection-bypass=${bypassSecret}`
  );
  if (!res.ok) throw new Error('Failed to check account status');
  const status = await res.json();

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'stripeConnect.setupCompleted': status.detailsSubmitted && status.payoutsEnabled,
    'stripeConnect.status': status,
    'stripeConnect.updatedAt': serverTimestamp()
  });
  return true;
};

// ========= Reminders =========
export const scheduleAppointmentReminder = async (appointment, userId) => {
  try {
    console.log(`Scheduling reminders for appointment on ${appointment.date} at ${appointment.time}`);
    
    if (!appointment.date || !appointment.time) {
      console.error('Missing appointment date or time for reminder');
      return false;
    }
    
    // Parse the appointment date and time
    let appointmentDateTime;
    try {
      // Combine date and time into a single Date object
      if (appointment.time.includes('AM') || appointment.time.includes('PM')) {
        // Format: "3:30 PM"
        const [timePart, ampm] = appointment.time.split(' ');
        const [hours, minutes] = timePart.split(':').map(Number);
        
        // Convert to 24-hour format
        let hour24 = hours;
        if (ampm === 'PM' && hours < 12) hour24 += 12;
        if (ampm === 'AM' && hours === 12) hour24 = 0;
        
        // Parse the date part
        const dateParts = appointment.date.split(/[-\/]/); // Split by - or /
        let year, month, day;
        
        if (dateParts[0].length === 4) {
          // Format: YYYY-MM-DD
          [year, month, day] = dateParts;
        } else {
          // Format: MM/DD/YYYY
          [month, day, year] = dateParts;
        }
        
        appointmentDateTime = new Date(year, month-1, day, hour24, minutes);
      } else {
        // Assume ISO format with T separator
        appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
      }
    } catch (e) {
      console.error('Error parsing appointment date/time:', e);
      return false;
    }
    
    if (isNaN(appointmentDateTime.getTime())) {
      console.error('Invalid appointment date/time:', appointment.date, appointment.time);
      return false;
    }
    
    console.log(`Appointment date/time parsed as: ${appointmentDateTime.toString()}`);
    
    // Schedule 24-hour reminder
    const reminder24h = new Date(appointmentDateTime);
    reminder24h.setHours(reminder24h.getHours() - 24);
    
    // Schedule 1-hour reminder
    const reminder1h = new Date(appointmentDateTime);
    reminder1h.setHours(reminder1h.getHours() - 1);
    
    const now = new Date();
    const scheduledReminders = [];
    
    // Only schedule if the reminder time is in the future
    if (reminder24h > now) {
      const id24h = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Appointment Tomorrow',
          body: `You have an appointment for ${appointment.serviceName || 'a haircut'} tomorrow at ${appointment.time}.`,
          data: { appointmentId: appointment.id, type: '24h' }
        },
        trigger: reminder24h
      });
      console.log(`Scheduled 24h reminder: ${id24h} for ${reminder24h}`);
      scheduledReminders.push(id24h);
    }
    
    if (reminder1h > now) {
      const id1h = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Appointment Soon',
          body: `Your appointment for ${appointment.serviceName || 'a haircut'} is in 1 hour at ${appointment.time}.`,
          data: { appointmentId: appointment.id, type: '1h' }
        },
        trigger: reminder1h
      });
      console.log(`Scheduled 1h reminder: ${id1h} for ${reminder1h}`);
      scheduledReminders.push(id1h);
    }
    
    // Store the scheduled reminder IDs in Firestore
    if (scheduledReminders.length > 0 && appointment.id) {
      try {
        const reminderData = {
          scheduledReminders,
          appointmentId: appointment.id,
          userId: userId || auth.currentUser?.uid,
          scheduledAt: serverTimestamp()
        };
        
        await addDoc(collection(db, 'reminders'), reminderData);
        console.log(`Stored ${scheduledReminders.length} reminder references in Firestore`);
      } catch (e) {
        console.error('Failed to store reminder references:', e);
        // Don't fail the function if this part fails
      }
    }
    
    return scheduledReminders.length > 0;
  } catch (error) {
    console.error('Error scheduling appointment reminder:', error);
    return false;
  }
};

// Add a new function to check if a specific slot is already booked
export async function isTimeSlotBooked(barberId, date, time) {
  console.log(`Checking if time slot is booked: ${barberId}, ${date}, ${time}`);
  
  const appointmentsRef = collection(db, 'appointments');
  const q = query(
    appointmentsRef,
    where('barberId', '==', barberId),
    where('date', '==', date),
    where('time', '==', time),
    where('status', 'in', ['pending', 'confirmed']) // Don't block cancelled appointments
  );
  
  const snapshot = await getDocs(q);
  const isBooked = !snapshot.empty;
  
  console.log(`Time slot ${date} at ${time}: ${isBooked ? 'BOOKED' : 'AVAILABLE'}`);
  return isBooked;
}

// Function to get all booked slots for a specific date
export async function getBookedSlotsForDate(barberId, date) {
  console.log(`Getting booked slots for barber ${barberId} on date ${date}`);
  
  if (!barberId || !date) {
    console.warn('Missing barberId or date for getBookedSlotsForDate');
    return [];
  }
  
  try {
    // First try with current user's appointments only (more likely to succeed)
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('No authenticated user, cannot check appointments');
      return [];
    }

    // Try to query appointments where current user is the customer 
    // OR where current user is the barber
    let bookedTimes = [];
    
    // Try current user's appointments first
    try {
      const customerApptsRef = query(
        collection(db, 'appointments'),
        where('customerId', '==', currentUser.uid),
        where('date', '==', date)
      );
      
      const customerSnap = await getDocs(customerApptsRef);
      customerSnap.forEach(doc => {
        const data = doc.data();
        if (data.time) bookedTimes.push(data.time);
      });
      
      console.log(`Found ${bookedTimes.length} of user's own appointments`);
    } catch (e) {
      console.warn('Could not query user appointments:', e.message);
    }
    
    // If current user is the barber, try their appointments too
    if (currentUser.uid === barberId) {
      try {
        const barberApptsRef = query(
          collection(db, 'appointments'),
          where('barberId', '==', barberId),
          where('date', '==', date)
        );
        
        const barberSnap = await getDocs(barberApptsRef);
        const barberBookedTimes = [];
        
        barberSnap.forEach(doc => {
          const data = doc.data();
          if (data.time && !bookedTimes.includes(data.time)) {
            barberBookedTimes.push(data.time);
          }
        });
        
        bookedTimes = [...bookedTimes, ...barberBookedTimes];
        console.log(`Found ${barberBookedTimes.length} barber appointments`);
      } catch (e) {
        console.warn('Could not query barber appointments:', e.message);
      }
    }
    
    // If we have permissions or current user is the barber, try all appointments
    if (bookedTimes.length === 0) {
      console.log('Falling back to general appointment query (may fail due to permissions)');
      try {
        const appointmentsRef = collection(db, 'appointments');
        const q = query(
          appointmentsRef,
          where('barberId', '==', barberId),
          where('date', '==', date),
          where('status', 'in', ['pending', 'confirmed'])
        );
        
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.time) bookedTimes.push(data.time);
        });
        
        console.log(`Found ${bookedTimes.length} booked slots via direct query`);
      } catch (permError) {
        console.warn('Permission denied for general appointment query:', permError.message);
      }
    }
    
    return bookedTimes;
  } catch (error) {
    console.error(`Error getting booked slots for ${date}:`, error);
    console.log('Returning empty array due to error');
    return [];
  }
}

// Read availability (dates -> ['HH:MM']) from Firestore
export const getBarberAvailability = async (barberId) => {
  const userRef = doc(db, 'users', barberId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return { availableDates: [], allowedSlotsByDate: {} };

  const availabilityMap = snap.data()?.availability || {};
  const allowedSlotsByDate = {};

  for (const [date, times] of Object.entries(availabilityMap)) {
    if (!Array.isArray(times)) continue;
    const normalized = Array.from(new Set(times.map(normalizeTimeTo24h).filter(Boolean)))
      .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    if (normalized.length) allowedSlotsByDate[date] = normalized;
  }

  const availableDates = Object.keys(allowedSlotsByDate).sort();
  return { availableDates, allowedSlotsByDate };
};

export { collection, doc, setDoc, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';

export const addBarberService = async (userId, service) => {
  if (!userId) throw new Error('Missing userId');
  const name = String(service?.name || '').trim() || 'Service';
  const price = Number(service?.price);
  const duration = Number(service?.duration);
  if (!Number.isFinite(price) || price <= 0) throw new Error('Price required');
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Duration required');

  const ref = doc(collection(db, 'users', userId, 'services'));
  const data = {
    id: ref.id,
    name,
    price,
    duration,
    photoUrl: service?.photoUrl ?? null,
    description: service?.description ?? '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, data, { merge: true });
  return data;
};

export const updateBarberService = async (userId, serviceId, patch) => {
  if (!userId || !serviceId) throw new Error('Missing ids');

  const ref = doc(db, 'users', userId, 'services', serviceId);
  const updates = {};

  if (patch.name != null) updates.name = String(patch.name).trim();

  if (patch.price != null) {
    const priceNum = Number(patch.price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) throw new Error('Invalid price');
    updates.price = priceNum;
  }

  if (patch.duration != null) {
    const durationNum = Number(patch.duration);
    if (!Number.isFinite(durationNum) || durationNum <= 0) throw new Error('Invalid duration');
    updates.duration = durationNum;
  }

  if (patch.photoUrl !== undefined) updates.photoUrl = patch.photoUrl ?? null;
  if (patch.description !== undefined) updates.description = String(patch.description || '');

  updates.updatedAt = serverTimestamp();

  await updateDoc(ref, updates);
  return { id: serviceId, ...updates };
};
