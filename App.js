// App.js - Standard Expo Router entry point

// Early diagnostics (must be first)
import './src/boot/diagnostics';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

// Register for push notifications
async function registerForPushNotificationsAsync() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }
    
    console.log('Notification permissions granted');
  } catch (error) {
    console.error('Error getting notification permissions:', error);
  }
}

// Set up notification handler before importing expo-router
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request permissions when the app loads
if (typeof document === 'undefined') {
  // Only run on native, not on web
  registerForPushNotificationsAsync();
}

// Import expo-router last
import 'expo-router/entry';
