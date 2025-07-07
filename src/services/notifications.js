import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { db } from '@/services/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import * as Calendar from 'expo-calendar';

export async function requestPermissions() {
  await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'ios') {
    await Calendar.requestCalendarPermissionsAsync();
  } else {
    await Calendar.requestPermissionsAsync();
  }
}

// Utility to convert 12-hour time with unicode spaces to 24-hour format
function to24Hour(timeStr) {
  if (!timeStr) return '';
  timeStr = String(timeStr).replace(/[\u202F\u00A0\u2009\u2007\u200A\u200B\u200C\u200D\uFEFF\s]+/g, ' ').trim();
  const parts = timeStr.split(' ');
  const time = parts[0];
  const modifier = parts[1] ? parts[1].toUpperCase() : '';
  if (!time) return '';
  let [hours, minutes] = time.split(':');
  hours = hours.padStart(2, '0');
  if (modifier === 'PM' && hours !== '12') {
    hours = String(parseInt(hours, 10) + 12).padStart(2, '0');
  }
  if (modifier === 'AM' && hours === '12') {
    hours = '00';
  }
  return `${hours}:${minutes ? minutes.padStart(2, '0') : '00'}`;
}

function getAppointmentDate(dateStr, timeStr) {
  let time24 = to24Hour(timeStr);
  if (/^\d{2}:\d{2}$/.test(time24)) {
    time24 += ':00';
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
  if (!dateRegex.test(dateStr) || !timeRegex.test(time24)) {
    console.error('Invalid date or time format', { dateStr, timeStr, time24 });
    throw new Error('Invalid date or time format');
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes, seconds] = time24.split(':').map(Number);
  if (
    isNaN(year) || isNaN(month) || isNaN(day) ||
    isNaN(hours) || isNaN(minutes) || (seconds !== undefined && isNaN(seconds))
  ) {
    console.error('Date or time contains NaN', { year, month, day, hours, minutes, seconds });
    throw new RangeError('Date value out of bounds');
  }
  const dateObj = new Date(year, month - 1, day, hours, minutes, seconds || 0);
  if (isNaN(dateObj.getTime())) {
    console.error('Constructed date is invalid', { year, month, day, hours, minutes, seconds });
    throw new RangeError('Date value out of bounds');
  }
  return dateObj;
}

export async function addAppointmentToCalendar(appointment, service = null, barber = null) {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0];

  // Sanitize and convert time to 24-hour format
  const time24 = to24Hour(appointment.time);
  // Combine date and time in ISO format
  const startDateStr = `${appointment.date}T${time24}:00`;
  const startDate = new Date(startDateStr);
  if (isNaN(startDate.getTime())) {
    console.error('Invalid startDate:', { startDateStr, appointment });
    throw new RangeError('Date value out of bounds');
  }
  
  // Use service duration if available, otherwise default to 30 minutes
  const duration = (service && service.duration) || 30;
  const endDate = new Date(startDate.getTime() + duration * 60000);

  // Use data from appointment object if service/barber objects are not provided
  const serviceName = (service && service.name) || appointment.serviceName || 'Appointment';
  const barberName = (barber && barber.name) || appointment.barberName || 'Barber';
  const barberAddress = (barber && barber.address) || '';
  const barberPhone = (barber && barber.phone) || '';

  const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
    title: `${serviceName} with ${barberName}`,
    startDate,
    endDate,
    notes: `Location: ${barberAddress}\nPhone: ${barberPhone}`,
    timeZone: 'America/New_York',
  });

  return eventId;
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export const registerForPushNotifications = async () => {
  let token;
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
};

// Save notification token to user profile
export const saveNotificationToken = async (userId, token) => {
  try {
    if (!userId || !token) return;
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        notificationToken: token,
        notificationsEnabled: true
      });
    }
  } catch (error) {
    console.error('Error saving notification token:', error);
  }
};

// Update notification settings
export const updateNotificationSettings = async (userId, settings) => {
  try {
    if (!userId) return;
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      notificationSettings: settings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
  }
};

// Get notification settings
export const getNotificationSettings = async (userId) => {
  try {
    if (!userId) return null;
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().notificationSettings || getDefaultNotificationSettings();
    }
    
    return getDefaultNotificationSettings();
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return getDefaultNotificationSettings();
  }
};

// Default notification settings
export const getDefaultNotificationSettings = () => {
  return {
    appointmentReminders: true,
    appointmentUpdates: true,
    promotions: true,
    bulletinUpdates: true,
    smsNotifications: false
  };
};

// Schedule local notification
export const scheduleLocalNotification = async (title, body, trigger) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

// Save notification to Firestore
export const saveNotificationToFirestore = async (userId, notification) => {
  try {
    if (!userId) {
      console.error('❌ No userId provided to saveNotificationToFirestore');
      return;
    }
    
    console.log('📤 Saving notification to Firestore:', { userId, notification });
    
    const notificationRef = doc(db, 'users', userId, 'notifications', notification.id || String(Date.now()));
    await setDoc(notificationRef, {
      ...notification,
      timestamp: new Date(),
      read: false,
    });
    
    console.log('✅ Notification saved to Firestore successfully:', notification.id);
  } catch (error) {
    console.error('❌ Error saving notification to Firestore:', error);
  }
};

// Schedule appointment reminder (Hybrid: Local + Firestore)
export const scheduleAppointmentReminder = async (appointment, userId) => {
  try {
    const { date, serviceName, barberName } = appointment;
    const startTime = appointment.startTime || appointment.time;
    if (!date || !startTime) throw new Error('Missing date or time');

    // Use robust date/time parsing
    const appointmentDate = getAppointmentDate(date, startTime);
    const oneDayBefore = new Date(appointmentDate.getTime());
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    const oneHourBefore = new Date(appointmentDate.getTime());
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);

    console.log('[Reminder Debug] appointmentDate:', appointmentDate);
    console.log('[Reminder Debug] oneDayBefore:', oneDayBefore, 'now:', new Date());
    console.log('[Reminder Debug] oneHourBefore:', oneHourBefore, 'now:', new Date());

    // Schedule 24-hour reminder
    if (oneDayBefore > new Date()) {
      console.log('[Reminder Debug] Scheduling 1-day reminder for:', oneDayBefore);
      
      // Schedule local notification
      const oneDayId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Appointment Reminder',
          body: `You have a ${serviceName} appointment with ${barberName} on ${date} at ${startTime}.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'appointment_reminder', appointmentId: appointment.id },
        },
        trigger: { date: oneDayBefore },
      });
      
      // Save to Firestore for notification history
      if (userId) {
        await saveNotificationToFirestore(userId, {
          id: `reminder_24h_${appointment.id}`,
          title: '24-Hour Reminder Set',
          body: `A reminder has been set for 24 hours before your appointment on ${date} at ${startTime}.`,
          type: 'appointment_reminder',
          appointmentId: appointment.id,
          appointmentDate: date,
          appointmentTime: startTime,
          serviceName: serviceName,
          barberName: barberName,
          localNotificationId: oneDayId,
        });
      }
      
      console.log('[Reminder Debug] 1-day reminder scheduled with ID:', oneDayId);
    }
    
    // Schedule 1-hour reminder
    if (oneHourBefore > new Date()) {
      console.log('[Reminder Debug] Scheduling 1-hour reminder for:', oneHourBefore);
      
      // Schedule local notification
      const oneHourId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Upcoming Appointment',
          body: `Your ${serviceName} appointment with ${barberName} is on ${date} at ${startTime}.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'appointment_reminder', appointmentId: appointment.id },
        },
        trigger: { date: oneHourBefore },
      });
      
      // Save to Firestore for notification history
      if (userId) {
        await saveNotificationToFirestore(userId, {
          id: `reminder_1h_${appointment.id}`,
          title: '1-Hour Reminder Set',
          body: `A reminder has been set for 1 hour before your appointment on ${date} at ${startTime}.`,
          type: 'appointment_reminder',
          appointmentId: appointment.id,
          appointmentDate: date,
          appointmentTime: startTime,
          serviceName: serviceName,
          barberName: barberName,
          localNotificationId: oneHourId,
        });
      }
      
      console.log('[Reminder Debug] 1-hour reminder scheduled with ID:', oneHourId);
    }
  } catch (error) {
    console.error('[Reminder Debug] Error scheduling appointment reminder:', error);
  }
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

// Cancel notifications for a specific appointment
export const cancelAppointmentNotifications = async (appointmentId, userId) => {
  try {
    console.log('[Cancel Notifications] Cancelling notifications for appointment:', appointmentId);
    
    // Get all scheduled notifications to find ones for this appointment
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('[Cancel Notifications] Found scheduled notifications:', scheduledNotifications.length);
    
    // Cancel notifications that match this appointment
    let cancelledCount = 0;
    for (const notification of scheduledNotifications) {
      if (notification.content?.data?.appointmentId === appointmentId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        cancelledCount++;
        console.log('[Cancel Notifications] Cancelled notification:', notification.identifier);
      }
    }
    
    // Also remove from Firestore notifications if we have userId
    if (userId) {
      try {
        const notificationsRef = collection(db, 'users', userId, 'notifications');
        const q = query(notificationsRef, where('appointmentId', '==', appointmentId));
        const snapshot = await getDocs(q);
        
        for (const docSnapshot of snapshot.docs) {
          // Update to show as cancelled rather than deleting
          await updateDoc(docSnapshot.ref, {
            status: 'cancelled',
            cancelledAt: serverTimestamp()
          });
        }
        
        console.log('[Cancel Notifications] Updated Firestore notifications:', snapshot.size);
      } catch (error) {
        console.error('[Cancel Notifications] Error updating Firestore notifications:', error);
      }
    }
    
    console.log(`✅ Cancelled ${cancelledCount} scheduled notifications for appointment ${appointmentId}`);
    return { success: true, cancelledCount };
  } catch (error) {
    console.error('❌ Error cancelling appointment notifications:', error);
    throw error;
  }
};

// Remove appointment from calendar
export const removeAppointmentFromCalendar = async (appointment) => {
  try {
    console.log('[Calendar] Removing appointment from calendar:', appointment.id);
    
    // Get calendar permissions first
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[Calendar] Calendar permission not granted');
      return { success: false, reason: 'Permission denied' };
    }

    // Get all calendars
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    console.log('[Calendar] Found calendars:', calendars.length);

    // Look for events that match our appointment
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // Search next year
    
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1); // Search past year

    let removedCount = 0;
    
    for (const calendar of calendars) {
      try {
        const events = await Calendar.getEventsAsync([calendar.id], startDate, endDate);
        
        // Find events that match our appointment
        for (const event of events) {
          // Match by title and date (since we don't store calendar event IDs)
          const appointmentTitle = `${appointment.serviceName} with ${appointment.barberName}`;
          
          if (event.title === appointmentTitle || 
              event.title.includes(appointment.serviceName) && event.title.includes(appointment.barberName)) {
            
            // Additional check: match the date
            const eventDate = new Date(event.startDate);
            const appointmentDateStr = appointment.date; // Should be YYYY-MM-DD format
            
            if (appointmentDateStr) {
              const [year, month, day] = appointmentDateStr.split('-').map(Number);
              const appointmentCalendarDate = new Date(year, month - 1, day);
              
              // Check if dates match (same day)
              if (eventDate.getFullYear() === appointmentCalendarDate.getFullYear() &&
                  eventDate.getMonth() === appointmentCalendarDate.getMonth() &&
                  eventDate.getDate() === appointmentCalendarDate.getDate()) {
                
                console.log('[Calendar] Removing matching event:', event.title, event.startDate);
                await Calendar.deleteEventAsync(event.id);
                removedCount++;
              }
            }
          }
        }
      } catch (error) {
        console.warn('[Calendar] Error searching calendar:', calendar.title, error);
      }
    }
    
    console.log(`✅ Removed ${removedCount} calendar events for appointment`);
    return { success: true, removedCount };
    
  } catch (error) {
    console.error('❌ Error removing appointment from calendar:', error);
    return { success: false, error: error.message };
  }
};

// Add notification listener
export const addNotificationListener = (callback) => {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return subscription;
};

// Add notification response listener
export const addNotificationResponseListener = (callback) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return subscription;
};

// Test function to create a sample notification (for debugging)
export const createTestNotification = async (userId) => {
  try {
    if (!userId) {
      console.error('No userId provided for test notification');
      return;
    }

    const testNotification = {
      id: `test_${Date.now()}`,
      title: 'Test Notification',
      body: 'This is a test notification to verify the system is working.',
      type: 'test',
      appointmentDate: '2025-07-05',
      appointmentTime: '2:00 PM',
      serviceName: 'Test Service',
      barberName: 'Test Barber',
    };

    await saveNotificationToFirestore(userId, testNotification);
    console.log('✅ Test notification created successfully:', testNotification);
    return testNotification;
  } catch (error) {
    console.error('❌ Error creating test notification:', error);
  }
};

// Test function to schedule immediate reminders (for testing purposes)
export const scheduleTestReminder = async (appointment, userId, testDelaySeconds = 10) => {
  try {
    const { serviceName, barberName, date, time } = appointment;
    const startTime = appointment.startTime || time;
    
    console.log(`🧪 Scheduling test reminder in ${testDelaySeconds} seconds...`);
    
    // Schedule a test notification for X seconds from now
    const testId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'TEST: Appointment Reminder',
        body: `TEST REMINDER: You have a ${serviceName} appointment with ${barberName} on ${date} at ${startTime}.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'test_reminder', appointmentId: appointment.id },
      },
      trigger: { seconds: testDelaySeconds },
    });
    
    console.log(`✅ Test reminder scheduled with ID: ${testId} - will fire in ${testDelaySeconds} seconds`);
    
    // Also save to Firestore
    if (userId) {
      await saveNotificationToFirestore(userId, {
        id: `test_reminder_${Date.now()}`,
        title: 'Test Reminder Scheduled',
        body: `A test reminder has been scheduled to fire in ${testDelaySeconds} seconds for your appointment on ${date} at ${startTime}.`,
        type: 'test_reminder',
        appointmentId: appointment.id,
        appointmentDate: date,
        appointmentTime: startTime,
        serviceName: serviceName,
        barberName: barberName,
        localNotificationId: testId,
      });
    }
    
    return testId;
  } catch (error) {
    console.error('❌ Error scheduling test reminder:', error);
  }
};

export default {
  requestPermissions,
  addAppointmentToCalendar,
  registerForPushNotifications,
  saveNotificationToken,
  updateNotificationSettings,
  getNotificationSettings,
  getDefaultNotificationSettings,
  scheduleLocalNotification,
  scheduleAppointmentReminder,
  scheduleTestReminder,
  cancelAllNotifications,
  cancelAppointmentNotifications,
  addNotificationListener,
  addNotificationResponseListener,
  createTestNotification,
  scheduleTestReminder,
  removeAppointmentFromCalendar
};
