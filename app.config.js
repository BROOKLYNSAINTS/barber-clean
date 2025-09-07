import 'dotenv/config';

export default {
  name: 'barber-clean',
  slug: 'barber-clean',
  version: '1.0.1',
  //jsEngine: 'jsc',
  orientation: 'portrait',
  icon: './assets/icon-512.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/icon-512.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    buildNumber: '21',
    infoPlist: {
      "ITSAppUsesNonExemptEncryption": false,
      NSSpeechRecognitionUsageDescription: "This app uses speech recognition to convert your voice into text for easier input.",
      NSMicrophoneUsageDescription: "This app requires microphone access to capture your voice for speech recognition.",
      NSCameraUsageDescription: "This app requires camera access to take photos for your profile and appointments.",
      NSPhotoLibraryUsageDescription: "This app requires photo library access to select photos for your profile and appointments.",
      NSLocationWhenInUseUsageDescription: "This app requires location access to find nearby barbers and salons.",
      NSLocationAlwaysAndWhenInUseUsageDescription: "This app requires location access to provide location-based services even when the app is in the background.",
      NSLocationAlwaysUsageDescription: "This app requires location access to provide location-based services even when the app is in the background.",
      NSUserTrackingUsageDescription: "This app uses tracking to provide personalized ads and improve user experience.",
      NSCalendarsUsageDescription: "This app requires calendar access to schedule your appointments.",
      NSRemindersUsageDescription: "This app requires reminders access to set appointment reminders.",
      NSCalendarsFullAccessUsageDescription: "This app needs full access to your calendar to create and manage appointments.",
      NSRemindersFullAccessUsageDescription: "This app needs full access to your reminders to manage appointment notifications.",
    },
    bundleIdentifier: 'com.ScheduleSync.barber',
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
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    eas: {
      projectId: "34c586b7-af2c-411d-9fbd-5cb699e2b12e"
    }
  },
  plugins: [
    [
      'expo-calendar',
      {
        calendarPermission: 'Allow access to your calendar to schedule appointments.',
        remindersPermission: 'Allow access to your reminders to set appointment notifications.',
      },
    ],
  ],
};
