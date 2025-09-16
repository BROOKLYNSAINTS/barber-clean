// fix-firebase-auth.js
// This script helps fix common Firebase auth issues related to Keychain access

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getAuth, signOut } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence } from 'firebase/auth/react-native';

// Import your Firebase config
import firebaseConfig from './src/services/firebaseConfig';

/**
 * This function reinitializes Firebase Auth with AsyncStorage instead of Keychain
 * which can help resolve some authentication-related crashes
 */
export const fixFirebaseAuthStorage = async () => {
  try {
    console.log('🔧 Fixing Firebase Auth persistence...');
    
    // Initialize Firebase with your config
    const app = initializeApp(firebaseConfig);
    
    // Get current auth instance
    const currentAuth = getAuth(app);
    
    // Try to sign out first to clear any corrupted tokens
    try {
      if (currentAuth?.currentUser) {
        console.log('📤 Signing out current user to clear any corrupted tokens...');
        await signOut(currentAuth);
      }
    } catch (signOutError) {
      console.warn('⚠️ Error signing out:', signOutError.message);
    }
    
    // Reinitialize auth with AsyncStorage persistence
    const auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    
    console.log('✅ Firebase Auth persistence fixed! Now using AsyncStorage instead of Keychain');
    
    return auth;
  } catch (error) {
    console.error('❌ Failed to fix Firebase Auth persistence:', error);
    throw error;
  }
};

export default fixFirebaseAuthStorage;