import 'dotenv/config';

export default {
  name: 'barber-clean',
  slug: 'barber-clean',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/adaptive-icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
infoPlist: {
      NSCalendarsUsageDescription: "This app requires calendar access to schedule your appointments.",
      NSCalendarsFullAccessUsageDescription: "This app needs full access to your calendar to create and manage appointments.",
    },    bundleIdentifier: 'com.ScheduleSync.barber',
    supportsTablet: true,
  },
  android: {
    package: 'com.ScheduleSync.barber',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
  },
  extra: {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY
  },
  plugins: [
    [
      'expo-calendar',
      {
        calendarPermission: 'Allow access to your calendar.',
        remindersPermission: 'Allow access to your reminders.',
      },
    ],
  ],
};
