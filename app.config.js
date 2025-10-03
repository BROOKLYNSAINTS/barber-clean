try { require('dotenv').config(); } catch {}

// For debugging purposes, log what we're seeing
console.log('Environment variables check:');
console.log('FIREBASE_DEV_API_KEY exists:', !!process.env.EXPO_PUBLIC_FIREBASE_DEV_API_KEY);
console.log('IS_TESTFLIGHT:', process.env.EXPO_PUBLIC_IS_TESTFLIGHT);
console.log('BUILD_TYPE:', process.env.EXPO_PUBLIC_BUILD_TYPE);

export default {
  name: "barber-clean",
  slug: "barber-clean",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/icon-512.png",
  userInterfaceStyle: "light",
  scheme: "barberscheduler",
  splash: { image: "./assets/icon-512.png", resizeMode: "contain", backgroundColor: "#ffffff" },
  assetBundlePatterns: ["**/*"],
  ios: {
    buildNumber: "91",
    bundleIdentifier: "com.ScheduleSync.barber",
    supportsTablet: true,
    jsEngine: "hermes",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ["remote-notification"],
      NSCameraUsageDescription: "We use the camera to let you take or upload profile and shop photos.",
      NSPhotoLibraryUsageDescription: "We access your photo library so you can choose photos to upload.",
      NSPhotoLibraryAddUsageDescription: "We save images to your photo library when you choose to export or save."
    },
    associatedDomains: [
      "applinks:barber-38b88.firebaseapp.com"
    ],
    config: {
      usesNonExemptEncryption: false
    }
  },
  android: {
    package: "com.ScheduleSync.barber",
    adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png", backgroundColor: "#FFFFFF" }
  },
  plugins: ["expo-splash-screen", "expo-router", "expo-asset"],
  web: { bundler: "metro" },
  extra: {
    // Use environment variables instead of hardcoded values
    OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    isTestFlight: process.env.EXPO_PUBLIC_IS_TESTFLIGHT === 'true',
    buildType: process.env.EXPO_PUBLIC_BUILD_TYPE || 'development',
    eas: {
      projectId: "34c586b7-af2c-411d-9fbd-5cb699e2b12e"
    },
    // Include BOTH development and production configs
    firebaseDevConfig: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_DEV_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_DEV_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_DEV_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_DEV_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_DEV_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_DEV_APP_ID,
      measurementId: process.env.EXPO_PUBLIC_FIREBASE_DEV_MEASUREMENT_ID
    },
    // Production config
    firebaseProdConfig: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_PROD_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_PROD_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROD_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_PROD_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_PROD_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_PROD_APP_ID,
      measurementId: process.env.EXPO_PUBLIC_FIREBASE_PROD_MEASUREMENT_ID
    },
    STRIPE_TEST_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY,
    STRIPE_LIVE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY,
    STRIPE_BACKEND_URL: process.env.EXPO_PUBLIC_STRIPE_BACKEND_URL
  },
  updates: {
    url: "https://u.expo.dev/34c586b7-af2c-411d-9fbd-5cb699e2b12e",
    enabled: true,
    fallbackToCacheTimeout: 0
  },
  runtimeVersion: "1.0.0",
};
