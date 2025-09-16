import 'dotenv/config';

export default {
  name: 'barber-clean',
  slug: 'barber-clean',
  version: '1.0.1',
  orientation: 'portrait',
  icon: './assets/icon-512.png',
  userInterfaceStyle: 'light',
  scheme: 'barberscheduler',
  splash: {
    image: './assets/icon-512.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
    hideExponentIconInStatusBar: true
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    buildNumber: '60',
    bundleIdentifier: 'com.ScheduleSync.barber',
    supportsTablet: true,
    requireFullScreen: false,
    jsEngine: "hermes"
  },
  android: {
    package: 'com.ScheduleSync.barber',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
  },
  extra: {
    isTestFlight: true, // Force TestFlight mode for preview build
    buildType: 'preview',
    
    // Firebase Development/Test Environment
    FIREBASE_DEV_API_KEY: process.env.FIREBASE_DEV_API_KEY,
    FIREBASE_DEV_AUTH_DOMAIN: process.env.FIREBASE_DEV_AUTH_DOMAIN,
    FIREBASE_DEV_PROJECT_ID: process.env.FIREBASE_DEV_PROJECT_ID,
    FIREBASE_DEV_STORAGE_BUCKET: process.env.FIREBASE_DEV_STORAGE_BUCKET,
    FIREBASE_DEV_MESSAGING_SENDER_ID: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID,
    FIREBASE_DEV_APP_ID: process.env.FIREBASE_DEV_APP_ID,
    FIREBASE_DEV_MEASUREMENT_ID: process.env.FIREBASE_DEV_MEASUREMENT_ID,
    
    // Firebase Production Environment
    FIREBASE_PROD_API_KEY: process.env.FIREBASE_PROD_API_KEY,
    FIREBASE_PROD_AUTH_DOMAIN: process.env.FIREBASE_PROD_AUTH_DOMAIN,
    FIREBASE_PROD_PROJECT_ID: process.env.FIREBASE_PROD_PROJECT_ID,
    FIREBASE_PROD_STORAGE_BUCKET: process.env.FIREBASE_PROD_STORAGE_BUCKET,
    FIREBASE_PROD_MESSAGING_SENDER_ID: process.env.FIREBASE_PROD_MESSAGING_SENDER_ID,
    FIREBASE_PROD_APP_ID: process.env.FIREBASE_PROD_APP_ID,
    FIREBASE_PROD_MEASUREMENT_ID: process.env.FIREBASE_PROD_MEASUREMENT_ID,
    
    // Stripe Configuration
    STRIPE_TEST_PUBLISHABLE_KEY: process.env.STRIPE_TEST_PUBLISHABLE_KEY,
    STRIPE_LIVE_PUBLISHABLE_KEY: process.env.STRIPE_LIVE_PUBLISHABLE_KEY,
    STRIPE_BACKEND_URL: process.env.STRIPE_BACKEND_URL,
    MERCHANT_IDENTIFIER: process.env.MERCHANT_IDENTIFIER,
    URL_SCHEME: process.env.URL_SCHEME,
    
    eas: {
      projectId: "34c586b7-af2c-411d-9fbd-5cb699e2b12e"
    }
  },
  plugins: [
    "expo-splash-screen",
    "expo-router",
  ],
  web: {
    bundler: "metro"
  }
};