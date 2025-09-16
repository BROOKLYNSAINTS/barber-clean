// test-firebase-config.cjs
// Script to test Firebase configuration and verify environment settings
require('dotenv').config();
const { Platform } = require('react-native');

// Manually create a config from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_DEV_API_KEY,
  authDomain: process.env.FIREBASE_DEV_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_DEV_PROJECT_ID,
  storageBucket: process.env.FIREBASE_DEV_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_DEV_APP_ID,
  measurementId: process.env.FIREBASE_DEV_MEASUREMENT_ID
};

// This script helps debug Firebase configuration issues
console.log('\n🔍 FIREBASE CONFIGURATION TEST\n');

// Show Firebase config
console.log('\n🔥 Firebase Configuration:');
console.log('- apiKey:', firebaseConfig.apiKey ? 'Valid key present' : 'MISSING');
console.log('- projectId:', firebaseConfig.projectId);
console.log('- authDomain:', firebaseConfig.authDomain);

// Check environment variables
console.log('\n🔑 Environment Variables:');
console.log('- FIREBASE_DEV_API_KEY:', process.env.FIREBASE_DEV_API_KEY ? 'Present' : 'MISSING');
console.log('- FIREBASE_PROD_API_KEY:', process.env.FIREBASE_PROD_API_KEY ? 'Present' : 'MISSING');

// Initialize Firebase to test connection
try {
  const { initializeApp } = require('firebase/app');
  const app = initializeApp(firebaseConfig);
  console.log('\n✅ Firebase initialized successfully with test configuration');
  
  // Try to initialize Auth
  const { getAuth } = require('firebase/auth');
  const auth = getAuth(app);
  console.log('✅ Firebase Auth initialized successfully');
  
  // Try to initialize Firestore
  const { getFirestore } = require('firebase/firestore');
  const db = getFirestore(app);
  console.log('✅ Firebase Firestore initialized successfully');
  
} catch (error) {
  console.error('\n❌ Firebase initialization error:', error.message);
}

console.log('\n📊 Final Analysis:');
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  console.log('✅ Firebase configuration appears to be valid.');
} else {
  console.log('❌ Firebase configuration is missing critical values.');
}
