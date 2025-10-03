import * as Notifications from 'expo-notifications';
import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/services/firebase';

function normalizeTimeTo24h(raw = '') {
  const s = String(raw).replace(/[\u202F\u00A0]/g, ' ').trim();
  const cleaned = s.replace(/([AaPp])\.?\s*[Mm]\.?/g, (m, a) => ` ${a.toUpperCase()}M`).trim();
  const parts = cleaned.split(' ');
  const hhmm = parts[0] || '';
  const ampm = (parts[1] || '').toUpperCase(); // AM | PM | ''
  let [h, m] = hhmm.split(':');
  if (!h) return '';
  if (!m) m = '00';
  let hour = parseInt(h, 10);
  const min = parseInt(m, 10);
  if (Number.isNaN(hour) || Number.isNaN(min)) return '';
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function toAppointmentDate(dateStr, timeStr) {
  const t24 = normalizeTimeTo24h(timeStr);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !/^\d{2}:\d{2}$/.test(t24)) {
    throw new Error('Invalid date/time');
  }
  return new Date(`${dateStr}T${t24}`);
}

async function ensurePermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function createInAppNotification(userId, payload) {
  if (!userId) return;
  
  try {
    await addDoc(collection(db, 'users', userId, 'notifications'), {
      ...payload,
      userId: userId, // ADD THIS LINE - required by security rules
      read: false,
      createdAt: serverTimestamp(),
    });
    console.log('Created in-app notification for user', userId);
  } catch (err) {
    console.error('Failed to create in-app notification:', err);
  }
}

/**
 * Schedules local notifications 24h and 1h before, and writes in-app notifications.
 * Returns { id24?: string, id1?: string }
 */
export async function scheduleAppointmentReminder(appointment, userId) {
  // Skip if no appointment or user ID
  if (!appointment || !appointment.id || !userId) {
    console.log('⚠️ Missing appointment or userId for reminder setup');
    return { granted: false, error: 'Missing appointment or userId' };
  }

  // Check if this appointment already has reminders scheduled
  try {
    // Look for existing notifications for this appointment
    const notifQuery = query(
      collection(db, 'users', userId, 'notifications'),
      where('appointmentId', '==', appointment.id),
      where('type', 'in', ['reminder_24h', 'reminder_1h'])
    );
    
    const existingNotifs = await getDocs(notifQuery);
    
    if (!existingNotifs.empty) {
      console.log(`⚠️ Reminders already exist for appointment ${appointment.id}`);
      return { granted: true, alreadyExists: true };
    }
  } catch (err) {
    console.log('Error checking existing reminders:', err);
    // Continue anyway to make sure at least local notifications are created
  }

  // Request notification permissions if not already granted
  const granted = await ensurePermission();
  
  // Calculate 24h and 1h before appointment times
  const apptTime = toAppointmentDate(appointment.date, appointment.time);
  const now = new Date();
  
  // Debug the date/time parsing
  console.log('REMINDER DEBUG:', {
    appointmentTime: appointment.time,
    parsedApptTime: apptTime,
    now,
    userId
  });
  
  // Track created notifications to avoid duplicates
  const scheduledNotifications = {
    local: { '24h': false, '1h': false },
    inApp: { '24h': false, '1h': false }
  };
  
  // Create notification content with appointment details
  const mkContent = (when) => ({
    title: when === '24h' ? 'Appointment in 24 hours' : 'Appointment in 1 hour',
    body: `${appointment.serviceName || 'Service'} with ${appointment.barberName || 'your barber'} on ${appointment.date} at ${appointment.time}`,
    data: { type: 'appointment_reminder', when, appointmentId: appointment.id },
  });

  // Calculate trigger times (24h and 1h before appointment)
  const t24 = new Date(apptTime.getTime() - 24 * 60 * 60 * 1000);
  const t1 = new Date(apptTime.getTime() - 60 * 60 * 1000);
  
  const results = { granted };

  // Only schedule if the trigger time is in the future
  if (t24 > now && !scheduledNotifications.local['24h']) {
    console.log('Scheduling 24h reminder for', t24);
    if (granted) {
      results.id24h = await Notifications.scheduleNotificationAsync({
        content: mkContent('24h'),
        trigger: { type: 'date', date: t24 }, // Fix deprecated parameter warning
      });
      scheduledNotifications.local['24h'] = true;
    }
    
    // Also create in-app notification if not already created
    if (!scheduledNotifications.inApp['24h']) {
      try {
        await createInAppNotification(userId, {
          type: 'reminder_24h',
          title: 'Reminder: appointment in 24 hours',
          body: `${appointment.serviceName || 'Service'} at ${appointment.time} on ${appointment.date}`,
          appointmentId: appointment.id,
          barberId: appointment.barberId,
          date: appointment.date,
          time: appointment.time,
          userId: userId, // Add userId to match security rules
          read: false,
          createdAt: serverTimestamp(),
        });
        scheduledNotifications.inApp['24h'] = true;
      } catch (err) {
        console.error('Failed to create in-app notification:', err);
      }
    }
  } else {
    console.log('Skipping 24h reminder (in past or already scheduled)', t24);
  }

  if (t1 > now && !scheduledNotifications.local['1h']) {
    console.log('Scheduling 1h reminder for', t1);
    if (granted) {
      results.id1h = await Notifications.scheduleNotificationAsync({
        content: mkContent('1h'),
        trigger: { type: 'date', date: t1 }, // Fix deprecated parameter warning
      });
      scheduledNotifications.local['1h'] = true;
    }
    
    // Also create in-app notification if not already created
    if (!scheduledNotifications.inApp['1h']) {
      try {
        await createInAppNotification(userId, {
          type: 'reminder_1h',
          title: 'Reminder: appointment in 1 hour',
          body: `${appointment.serviceName || 'Service'} at ${appointment.time} on ${appointment.date}`,
          appointmentId: appointment.id,
          barberId: appointment.barberId,
          date: appointment.date,
          time: appointment.time,
          userId: userId, // Add userId to match security rules
          read: false,
          createdAt: serverTimestamp(),
        });
        scheduledNotifications.inApp['1h'] = true;
      } catch (err) {
        console.error('Failed to create in-app notification:', err);
      }
    }
  } else {
    console.log('Skipping 1h reminder (in past or already scheduled)', t1);
  }
  
  console.log('Scheduled reminders:', results);
  return results;
}

// Add this function if it doesn't exist
export async function cancelAppointmentNotifications(appointmentId, userId) {
  if (!appointmentId || !userId) {
    console.log('Missing appointmentId or userId for notification cancellation');
    return;
  }
  
  try {
    // Cancel local notifications
    const scheduledNotifs = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduledNotifs) {
      // Check if this notification is for our appointment
      if (notif.content?.data?.appointmentId === appointmentId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        console.log('Cancelled local notification:', notif.identifier);
      }
    }
    
    // Cancel in-app notifications in Firestore
    if (db) {
      const notifQuery = query(
        collection(db, 'users', userId, 'notifications'),
        where('appointmentId', '==', appointmentId),
        where('type', 'in', ['reminder_24h', 'reminder_1h'])
      );
      
      const notifSnap = await getDocs(notifQuery);
      if (!notifSnap.empty) {
        const batch = writeBatch(db);
        notifSnap.forEach(doc => {
          batch.update(doc.ref, { 
            status: 'cancelled',
            cancelledAt: serverTimestamp()
          });
        });
        await batch.commit();
        console.log(`Cancelled ${notifSnap.size} in-app notifications`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error cancelling notifications:', error);
    return false;
  }
}
