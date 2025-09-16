// src/utils/testFlightDiagnostics.js
// Utility functions to help diagnose issues in TestFlight builds
import { Platform } from 'react-native';
import { getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../services/firebaseEnvironment';

/**
 * Run a comprehensive Firebase auth diagnostic
 * This can be called from login screens to help troubleshoot issues
 */
export const runFirebaseAuthDiagnostic = async () => {
  console.log('======= 🔍 FIREBASE AUTH DIAGNOSTIC 🔍 =======');
  
  // Environment info
  console.log('📱 Platform:', Platform.OS, Platform.Version);
  console.log('🏠 Environment:', __DEV__ ? 'Development' : 'Production');
  
  // Check Firebase config
  console.log('🔑 Firebase Config Check:');
  const configValid = validateFirebaseConfig();
  
  // Check Firebase initialization
  console.log('🔄 Firebase Initialization Check:');
  const appsInitialized = getApps().length > 0;
  console.log('- Apps initialized:', appsInitialized ? 'Yes' : 'No');
  
  if (appsInitialized) {
    // Test anonymous auth if possible (to verify API key works)
    console.log('🔄 Testing Firebase Auth API Key:');
    try {
      const app = getApp();
      const auth = getAuth(app);
      
      console.log('- Auth instance available:', !!auth);
      
      // Only try anonymous auth if no user is signed in
      if (auth && !auth.currentUser) {
        try {
          await signInAnonymously(auth);
          console.log('✅ Anonymous auth successful - API key is working!');
        } catch (anonError) {
          console.error('❌ Anonymous auth failed:', anonError.code, anonError.message);
          if (anonError.code === 'auth/invalid-api-key') {
            console.error('🚫 API KEY ISSUE CONFIRMED');
          }
        }
      } else {
        console.log('👤 User already signed in, skipping anonymous auth test');
      }
    } catch (error) {
      console.error('❌ Error testing auth:', error);
    }
  }
  
  console.log('========================================');
  return {
    platform: Platform.OS,
    isDev: __DEV__,
    configValid,
    appsInitialized
  };
};

/**
 * Validate Firebase config
 */
function validateFirebaseConfig() {
  let isValid = true;
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  
  // Check for required fields
  for (const field of requiredFields) {
    if (!firebaseConfig[field]) {
      console.error(`❌ Missing required Firebase config: ${field}`);
      isValid = false;
    } else {
      console.log(`✅ ${field}: ${field === 'apiKey' ? 'PRESENT' : firebaseConfig[field]}`);
    }
  }
  
  // Check API key format
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('AIza')) {
    console.error('❌ Firebase API key has invalid format (should start with AIza)');
    isValid = false;
  }
  
  return isValid;
}
