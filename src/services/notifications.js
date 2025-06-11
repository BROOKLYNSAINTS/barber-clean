import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { db } from '@/services/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import * as Calendar from 'react-native-calendars';

export async function requestPermissions() {
  await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'ios') {
    await Calendar.requestCalendarPermissionsAsync();
  } else {
    await Calendar.requestPermissionsAsync();
  }
}
export async function addAppointmentToCalendar(appointment, service, barber) {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0];

  const startDate = new Date(`${appointment.date}T${appointment.time}`);
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
    const { date, startTime, serviceName, barberName } = appointment;
    
    // Schedule reminder for 24 hours before
    const reminderDate = new Date(date);
    const [hours, minutes] = startTime.split(':');
    reminderDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    reminderDate.setDate(reminderDate.getDate() - 1);
    
    // Only schedule if reminder time is in the future
    if (reminderDate > new Date()) {
      await scheduleLocalNotification(
        'Appointment Reminder',
        `You have a ${serviceName} appointment with ${barberName} tomorrow at ${startTime}.`,
        { date: reminderDate }
      );
    }
    
    // Schedule reminder for 1 hour before
    const hourReminderDate = new Date(date);
    hourReminderDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    hourReminderDate.setHours(hourReminderDate.getHours() - 1);
    
    // Only schedule if reminder time is in the future
    if (hourReminderDate > new Date()) {
      await scheduleLocalNotification(
        'Upcoming Appointment',
        `Your ${serviceName} appointment with ${barberName} is in 1 hour.`,
        { date: hourReminderDate }
      );
    }
  } catch (error) {
    console.error('Error scheduling appointment reminder:', error);
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
  registerForPushNotifications,
  saveNotificationToken,
  updateNotificationSettings,
  getNotificationSettings,
  scheduleLocalNotification,
  scheduleAppointmentReminder,
  cancelAllNotifications,
  addNotificationListener,
  addNotificationResponseListener
};
