// Improve appointment creation with proper validation

import { auth, db } from './firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, runTransaction, doc, getDoc } from 'firebase/firestore';

// Helper to normalize time strings to 24h format
export function normalizeTime(timeStr) {
  if (!timeStr) return '';
  
  const s = String(timeStr).replace(/[\u202F\u00A0]/g, ' ').trim();
  const cleaned = s.replace(/([AaPp])\.?\s*[Mm]\.?/g, (m, a) => ` ${a.toUpperCase()}M`).trim();
  const parts = cleaned.split(' ');
  const hhmm = parts[0] || '';
  const ampm = (parts[1] || '').toUpperCase();
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

// Use a transaction to check for conflicts and create appointment atomically
export const createAppointment = async (appointmentData) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to book an appointment');
    }
    
    const { barberId, date, time } = appointmentData;
    
    if (!barberId || !date || !time) {
      throw new Error('Missing required appointment information');
    }
    
    // Normalize time to 24-hour format
    const timeNorm = normalizeTime(time);
    
    // Use a transaction to ensure atomicity (prevent race conditions)
    return await runTransaction(db, async (transaction) => {
      // Check for existing appointments at this time
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('barberId', '==', barberId),
        where('date', '==', date),
        where('timeNorm', '==', timeNorm)
      );
      
      const existingSnap = await getDocs(q);
      
      // If any appointment exists for this slot, abort
      if (!existingSnap.empty) {
        console.log('Conflict detected:', existingSnap.docs.map(d => d.id));
        throw new Error('This time slot is already booked. Please select another time.');
      }
      
      // Create the appointment object with normalized time
      const appointment = {
        ...appointmentData,
        timeNorm,
        customerId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Create a new document reference
      const newAppointmentRef = doc(collection(db, 'appointments'));
      
      // Set the document in the transaction
      transaction.set(newAppointmentRef, appointment);
      
      // Return the created appointment with ID
      return {
        id: newAppointmentRef.id,
        ...appointment
      };
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

// Check if a time slot is available
export async function isTimeSlotAvailable(barberId, date, time) {
  if (!barberId || !date || !time) return false;
  
  try {
    const timeNorm = normalizeTime(time);
    
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('barberId', '==', barberId),
      where('date', '==', date),
      where('timeNorm', '==', timeNorm)
    );
    
    const snap = await getDocs(q);
    return snap.empty;
  } catch (error) {
    console.error('Error checking time slot:', error);
    return false;
  }
}

// Update to get availability from user document instead of separate collection

import { doc, getDoc } from 'firebase/firestore';

// Get barber availability from the user document
export async function getBarberAvailability(barberId, month, year) {
  try {
    if (!barberId) {
      throw new Error('Barber ID is required');
    }
    
    console.log(`Getting availability for barber ${barberId} for ${month}/${year}`);
    
    // Get the barber's user document
    const userRef = doc(db, 'users', barberId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log(`No user found for barber ID ${barberId}`);
      return null;
    }
    
    const userData = userSnap.data();
    
    // Look for availability in the user's document structure
    if (userData.availability) {
      console.log('Found availability field in user document');
      
      // Convert availabilityDates array to the expected format
      const availableDates = [];
      const workingHours = userData.workingHours || { start: '09:00', end: '17:00', interval: 30 };
      
      // Extract all dates from the availability map
      if (Array.isArray(userData.availability)) {
        // If availability is an array of date strings
        availableDates.push(...userData.availability);
        console.log(`Found ${availableDates.length} available dates in array format`);
      } 
      else if (typeof userData.availability === 'object') {
        // If availability is a map with date keys
        Object.keys(userData.availability).forEach(date => {
          // Filter by month/year if specified
          if (month && year) {
            const dateObj = new Date(date);
            if (dateObj.getMonth() + 1 === month && dateObj.getFullYear() === year) {
              availableDates.push(date);
            }
          } else {
            availableDates.push(date);
          }
        });
        console.log(`Found ${availableDates.length} available dates in map format`);
      }
      
      return {
        availableDates,
        workingHours,
        // Add any time slots specifically blocked or allowed for dates
        blockedSlotsByDate: userData.blockedSlotsByDate || {},
        allowedSlotsByDate: userData.allowedSlotsByDate || {}
      };
    }
    
    // If no availability data found
    console.log('No availability data found in user document');
    return null;
  } catch (error) {
    console.error('Error getting barber availability:', error);
    return null;
  }
}