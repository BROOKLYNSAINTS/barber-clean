import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { db } from '@/services/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
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

export async function addAppointmentToCalendar(appointment, service, barber) {
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
  const endDate = new Date(startDate.getTime() + (service.duration || 30) * 60000);

  const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
    title: `${service.name} with ${barber.name}`,
    startDate,
    endDate,
    notes: `Location: ${barber.address || ''}\nPhone: ${barber.phone || ''}`,
    timeZone: 'America/New_York',
  });

  return eventId;
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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

// Schedule appointment reminder
export const scheduleAppointmentReminder = async (appointment) => {
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

    // Only schedule if reminder time is in the future
    if (oneDayBefore > new Date()) {
      console.log('[Reminder Debug] Scheduling 1-day reminder for:', oneDayBefore);
      await scheduleLocalNotification(
        'Appointment Reminder',
        `You have a ${serviceName} appointment with ${barberName} tomorrow at ${startTime}.`,
        { date: oneDayBefore }
      );
    } else {
      console.log('[Reminder Debug] 1-day reminder not scheduled (in the past)');
    }
    if (oneHourBefore > new Date()) {
      console.log('[Reminder Debug] Scheduling 1-hour reminder for:', oneHourBefore);
      await scheduleLocalNotification(
        'Upcoming Appointment',
        `Your ${serviceName} appointment with ${barberName} is in 1 hour.`,
        { date: oneHourBefore }
      );
    } else {
      console.log('[Reminder Debug] 1-hour reminder not scheduled (in the past)');
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
  cancelAllNotifications,
  addNotificationListener,
  addNotificationResponseListener
};
