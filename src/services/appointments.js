import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Add this function to check for appointment conflicts

export const checkAppointmentConflict = (barberId, newAppointment) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get all existing appointments for this barber on the same day
      const appointmentDate = new Date(newAppointment.date);
      const dayStart = new Date(appointmentDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(appointmentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Query Firebase for existing appointments
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('barberId', '==', barberId),
        where('date', '>=', dayStart),
        where('date', '<=', dayEnd),
        where('status', 'in', ['confirmed', 'pending'])
      );
      
      const snapshot = await getDocs(q);
      const existingAppointments = [];
      snapshot.forEach(doc => {
        existingAppointments.push({ id: doc.id, ...doc.data() });
      });
      
      // Calculate new appointment's time range
      const newStart = new Date(newAppointment.date);
      const newEnd = new Date(newAppointment.date);
      newEnd.setMinutes(newEnd.getMinutes() + newAppointment.duration);
      
      // Check for conflicts with existing appointments
      const conflicts = existingAppointments.filter(existing => {
        const existingStart = new Date(existing.date);
        const existingEnd = new Date(existing.date);
        existingEnd.setMinutes(existingEnd.getMinutes() + existing.duration);
        
        // Check if appointments overlap
        return (
          (newStart >= existingStart && newStart < existingEnd) || // New appointment starts during existing
          (newEnd > existingStart && newEnd <= existingEnd) || // New appointment ends during existing
          (newStart <= existingStart && newEnd >= existingEnd) // New appointment completely covers existing
        );
      });
      
      if (conflicts.length > 0) {
        // There's a conflict - send back details
        resolve({
          hasConflict: true,
          conflicts: conflicts.map(c => ({
            id: c.id,
            time: new Date(c.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            duration: c.duration,
            service: c.serviceName
          }))
        });
      } else {
        // No conflicts
        resolve({ hasConflict: false });
      }
    } catch (error) {
      console.error('Error checking appointment conflicts:', error);
      reject(error);
    }
  });
};