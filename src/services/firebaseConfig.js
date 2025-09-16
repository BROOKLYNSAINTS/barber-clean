// src/services/firebaseConfig.js
// This file stores Firebase configuration for the app
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// EMULATOR MODE: When working with emulators, use localhost for authDomain
// This forces the use of the development database with the emulator
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD3FFprDwIZwECR5TkYCeOkiCUNGLp6qQM",
  // Use localhost for emulator
  authDomain: __DEV__ ? "localhost" : "barber-38b88.firebaseapp.com",
  projectId: "barber-38b88",  // Always use development project with emulators
  storageBucket: "barber-38b88.appspot.com",
  messagingSenderId: "910680290414",
  appId: "1:910680290414:web:606ee1c0e84c32e6bfcc8c",
  measurementId: "G-B6HMP9YK92"
};

// Validate the Firebase config before exporting it
const validateFirebaseConfig = (config) => {
  // Check for required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    console.error(`⚠️ Firebase config is missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Check API key format (should start with AIza)
  if (config.apiKey && !config.apiKey.startsWith('AIza')) {
    console.error('⚠️ Firebase API key appears to be in an invalid format (should start with AIza)');
  }
  
  // Log platform info for debugging
  console.log(`📱 Platform: ${Platform.OS}, Version: ${Platform.Version}`);
  console.log(`🏠 Environment: ${__DEV__ ? 'Development' : 'Production'}`);
  
  return config;
};

// Export the validated config
export const firebaseConfig = validateFirebaseConfig(FIREBASE_CONFIG);

// Important: The above values should match your Firebase project
// These are public keys and meant to be included in client code
// DO NOT use environment variables for these in production builds
