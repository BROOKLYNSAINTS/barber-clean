// comprehensive-fix.js
// This file implements a comprehensive set of fixes for app stability issues

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { recoverPaymentSystem } from './payment-recovery';
import { recoverNavigation } from './navigation-recovery';
import { applyTurboModuleFix } from './react-native-turbo-fix';

/**
 * Comprehensive app crash fix utility
 * Addresses multiple potential crash sources including:
 * - Firebase auth issues
 * - AsyncStorage corruption
 * - Keychain/Secure Store issues
 * - Navigation state corruption
 * - Payment/Stripe related issues
 */
export const applyComprehensiveFix = async () => {
  console.log('🔧 Applying comprehensive app stability fixes...');
  let results = {
    authReset: false,
    secureStoreReset: false,
    asyncStorageReset: false,
    paymentSystemRecovered: false,
    navigationRecovered: false,
    platformInfo: {}
  };
  
  try {
    // Get platform diagnostic information
    results.platformInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      appVersion: Application.nativeApplicationVersion,
      buildVersion: Application.nativeBuildVersion
    };
    
    console.log('📱 Platform info:', JSON.stringify(results.platformInfo, null, 2));
    
    // 1. Reset auth-related secure storage
    try {
      console.log('🔑 Resetting auth-related secure storage...');
      // Reset Firebase auth data in secure storage
      await resetFirebaseAuthStorage();
      results.authReset = true;
    } catch (authError) {
      console.warn('⚠️ Auth reset error:', authError.message);
    }
    
    // 2. Clear problematic secure store entries (if available)
    try {
      console.log('🔐 Resetting secure store entries...');
      await resetSecureStore();
      results.secureStoreReset = true;
    } catch (secureStoreError) {
      console.warn('⚠️ Secure store reset error:', secureStoreError.message);
    }
    
    // 3. Clean up AsyncStorage (keeping only critical data)
    try {
      console.log('📦 Cleaning up AsyncStorage...');
      await cleanupAsyncStorage();
      results.asyncStorageReset = true;
    } catch (asyncError) {
      console.warn('⚠️ AsyncStorage cleanup error:', asyncError.message);
    }
    
    // 4. Recover payment system (Stripe related)
    try {
      console.log('💳 Recovering payment system...');
      const paymentRecovery = await recoverPaymentSystem();
      results.paymentSystemRecovered = paymentRecovery.success;
      results.paymentRecoveryDetails = paymentRecovery;
    } catch (paymentError) {
      console.warn('⚠️ Payment system recovery error:', paymentError.message);
    }
    
    // 5. Recover navigation system
    try {
      console.log('🧭 Recovering navigation system...');
      const navigationRecovery = await recoverNavigation();
      results.navigationRecovered = navigationRecovery.success;
      results.navigationRecoveryDetails = navigationRecovery;
    } catch (navError) {
      console.warn('⚠️ Navigation system recovery error:', navError.message);
    }
    
    // 6. Apply TurboModule fixes (specifically for the crash in the log)
    try {
      console.log('🚀 Applying TurboModule fixes...');
      const turboFix = await applyTurboModuleFix();
      results.turboModuleFixed = turboFix.success;
      results.turboModuleDetails = turboFix;
    } catch (turboError) {
      console.warn('⚠️ TurboModule fix error:', turboError.message);
    }
    
    console.log('✅ Comprehensive fix applied successfully!');
    return {
      success: true,
      ...results
    };
  } catch (error) {
    console.error('❌ Failed to apply comprehensive fix:', error);
    return {
      success: false,
      error: error.message,
      ...results
    };
  }
};

/**
 * Reset Firebase auth storage
 * This clears any corrupted auth tokens that might be causing crashes
 */
const resetFirebaseAuthStorage = async () => {
  const firebaseAuthKeys = [
    'firebase:authUser:',
    'firebase:token:',
    'firebase:persistence:'
  ];
  
  // Get all keys from AsyncStorage
  const allKeys = await AsyncStorage.getAllKeys();
  
  // Find Firebase auth related keys
  const authKeys = allKeys.filter(key => 
    firebaseAuthKeys.some(authKey => key.includes(authKey))
  );
  
  if (authKeys.length > 0) {
    console.log(`🔥 Found ${authKeys.length} Firebase auth keys to reset`);
    await AsyncStorage.multiRemove(authKeys);
    return true;
  }
  
  console.log('ℹ️ No Firebase auth keys found to reset');
  return false;
};

/**
 * Reset SecureStore entries that might be causing crashes
 */
const resetSecureStore = async () => {
  // Only available on certain platforms
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    console.log('⏩ Skipping secure store reset (unsupported platform)');
    return false;
  }
  
  try {
    // Reset common secure store keys that might be problematic
    const keysToReset = [
      'firebase_auth_token',
      'apple_auth_state',
      'google_auth_state',
      'auth_refresh_token',
      'stripe_ephemeral_key'
    ];
    
    for (const key of keysToReset) {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (e) {
        // Ignore errors for keys that don't exist
      }
    }
    
    return true;
  } catch (error) {
    console.warn('⚠️ Error resetting secure store:', error);
    return false;
  }
};

/**
 * Clean up AsyncStorage by removing potentially corrupted data
 * but preserving important settings
 */
const cleanupAsyncStorage = async () => {
  // Get all keys
  const allKeys = await AsyncStorage.getAllKeys();
  
  // Keys to preserve (important settings)
  const keysToPreserve = [
    'user_settings',
    'theme_preference',
    'onboarding_complete',
    'notification_preferences'
  ];
  
  // Find keys to remove (everything except preserved keys)
  const keysToRemove = allKeys.filter(key => 
    !keysToPreserve.some(preserveKey => key.includes(preserveKey))
  );
  
  if (keysToRemove.length > 0) {
    console.log(`🧹 Cleaning up ${keysToRemove.length} AsyncStorage keys`);
    await AsyncStorage.multiRemove(keysToRemove);
    return true;
  }
  
  console.log('ℹ️ No AsyncStorage keys to clean up');
  return false;
};

export default applyComprehensiveFix;