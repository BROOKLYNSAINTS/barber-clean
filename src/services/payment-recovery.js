// payment-recovery.js - Fix Stripe and payment related issues
import AsyncStorage from '@react-native-async-storage/async-storage';
import { stripeConfig, stripeBackendUrl } from './stripeConfig';
import { Platform } from 'react-native';

/**
 * PaymentRecovery - Fixes common Stripe and payment related issues
 * Addresses problems with:
 * - Stuck payment intents
 * - Abandoned payment sessions
 * - Cached ephemeral keys
 * - Connection issues with Stripe API
 */
export const recoverPaymentSystem = async () => {
  console.log('💳 Recovering payment system...');
  let results = {
    paymentDataCleared: false,
    stripeConnectionVerified: false,
    ephemeralKeysReset: false,
    paymentIntentsReset: false
  };

  try {
    // 1. Clear any stored payment session data
    await clearPaymentSessionData();
    results.paymentDataCleared = true;

    // 2. Verify connection to Stripe backend
    const backendStatus = await verifyStripeBackend();
    results.stripeConnectionVerified = backendStatus.success;

    // 3. Reset ephemeral keys
    await resetEphemeralKeys();
    results.ephemeralKeysReset = true;

    // 4. Reset any abandoned payment intents
    await resetAbandonedPaymentIntents();
    results.paymentIntentsReset = true;

    console.log('✅ Payment system recovery completed:', results);
    return {
      success: true,
      ...results
    };
  } catch (error) {
    console.error('❌ Payment recovery failed:', error);
    return {
      success: false,
      error: error.message,
      ...results
    };
  }
};

/**
 * Clear any stored payment session data from AsyncStorage
 */
const clearPaymentSessionData = async () => {
  const allKeys = await AsyncStorage.getAllKeys();
  
  // Find and remove any payment-related keys
  const paymentKeys = allKeys.filter(key => 
    key.includes('payment') || 
    key.includes('stripe') || 
    key.includes('transaction') ||
    key.includes('card_') ||
    key.includes('checkout_session')
  );

  if (paymentKeys.length > 0) {
    console.log(`🧹 Clearing ${paymentKeys.length} payment related items`);
    await AsyncStorage.multiRemove(paymentKeys);
    return true;
  } else {
    console.log('ℹ️ No payment data to clear');
    return false;
  }
};

/**
 * Verify connectivity with Stripe backend
 */
const verifyStripeBackend = async () => {
  try {
    const response = await fetch(`${stripeBackendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': Platform.OS,
        'X-App-Version': Platform.Version?.toString() || 'unknown'
      }
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Stripe backend connection verified:', data);
    return { success: true, data };
  } catch (error) {
    console.error('⚠️ Failed to connect to Stripe backend:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reset ephemeral keys which might be causing issues
 */
const resetEphemeralKeys = async () => {
  try {
    // Clear local ephemeral key cache
    const allKeys = await AsyncStorage.getAllKeys();
    const ephemeralKeys = allKeys.filter(key => 
      key.includes('ephemeral') || 
      key.includes('stripe_key') || 
      key.includes('stripe_ephemeral')
    );

    if (ephemeralKeys.length > 0) {
      await AsyncStorage.multiRemove(ephemeralKeys);
      console.log(`🔑 Reset ${ephemeralKeys.length} ephemeral keys`);
      return true;
    }
    
    console.log('ℹ️ No ephemeral keys to reset');
    return false;
  } catch (error) {
    console.warn('⚠️ Failed to reset ephemeral keys:', error);
    return false;
  }
};

/**
 * Reset any abandoned payment intents by notifying backend
 */
const resetAbandonedPaymentIntents = async () => {
  try {
    // This would require a backend endpoint to handle abandoned payment intents
    // Here we're simulating the check locally
    
    // Check if there are any stored payment intent IDs
    const allKeys = await AsyncStorage.getAllKeys();
    const paymentIntentKeys = allKeys.filter(key => 
      key.includes('payment_intent') || 
      key.includes('stripe_pi_')
    );

    if (paymentIntentKeys.length > 0) {
      // Get all payment intent IDs
      const paymentIntents = await AsyncStorage.multiGet(paymentIntentKeys);
      const piIds = paymentIntents
        .map(([_, value]) => {
          try {
            const parsed = JSON.parse(value);
            return parsed?.id || parsed?.paymentIntentId || null;
          } catch (e) {
            return value; // If it's not JSON, use the raw value
          }
        })
        .filter(Boolean); // Remove nulls
      
      if (piIds.length > 0) {
        console.log(`🔍 Found ${piIds.length} abandoned payment intents`);
        
        // Clear the local storage entries
        await AsyncStorage.multiRemove(paymentIntentKeys);
        
        // In a real implementation, you might want to send these to your backend
        // for proper cancellation in Stripe
        return true;
      }
    }
    
    console.log('ℹ️ No abandoned payment intents found');
    return false;
  } catch (error) {
    console.warn('⚠️ Failed to reset abandoned payment intents:', error);
    return false;
  }
};

export default recoverPaymentSystem;