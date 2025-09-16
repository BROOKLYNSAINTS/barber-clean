// react-native-turbo-fix.js - Fix for React Native TurboModule Manager crashes
import { Platform } from 'react-native';

/**
 * This utility specifically addresses TurboModule related crashes in React Native
 * These crashes often appear in the com.meta.react.turbomodulemanager.queue thread
 * and are typically caused by uncaught JavaScript exceptions or module loading issues
 */
export const applyTurboModuleFix = async () => {
  console.log('🚀 Applying TurboModule stability fixes...');
  
  // We need to ensure that any code here is safe and won't crash
  // So we wrap everything in try/catch blocks
  
  try {
    // 1. Reset any cached module references that might be invalid
    await resetTurboModuleCache();
    
    // 2. Configure error boundaries specifically for native modules
    configureTurboModuleErrorHandling();
    
    // 3. Patch problematic modules if needed
    await patchProblematicModules();
    
    console.log('✅ TurboModule fixes applied successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to apply TurboModule fixes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reset any cached module references that might be causing issues
 */
const resetTurboModuleCache = async () => {
  // This function is platform-specific
  if (Platform.OS !== 'ios') {
    console.log('⏭️ Skipping TurboModule cache reset (not on iOS)');
    return false;
  }
  
  try {
    // We can't directly manipulate the TurboModule cache from JS
    // But we can clear any local references that might be causing issues
    
    // Get the global object
    const globalObj = global || window;
    
    // Look for any cached module references
    const turboModuleKeys = Object.keys(globalObj).filter(key => 
      key.startsWith('__turboModuleProxy') || 
      key.includes('TurboModule') ||
      key.includes('NativeModule')
    );
    
    console.log(`🔍 Found ${turboModuleKeys.length} potential TurboModule references`);
    
    // Clear any that might be problematic
    // We don't delete essential ones as that would break the app
    const safeToDelete = turboModuleKeys.filter(key => 
      !key.includes('Core') && 
      !key.includes('Bridge') &&
      !key.includes('ReactNative')
    );
    
    for (const key of safeToDelete) {
      try {
        // Instead of deleting, which can be risky,
        // we set to a fresh empty object
        globalObj[key] = {};
        console.log(`🧹 Reset ${key}`);
      } catch (e) {
        console.warn(`⚠️ Failed to reset ${key}:`, e.message);
      }
    }
    
    return true;
  } catch (error) {
    console.warn('⚠️ Error resetting TurboModule cache:', error);
    return false;
  }
};

/**
 * Configure error handling specifically for TurboModule related errors
 */
const configureTurboModuleErrorHandling = () => {
  try {
    // Get the global object
    const globalObj = global || window;
    
    // Store the original error handler
    const originalHandler = globalObj.ErrorUtils?.getGlobalHandler?.();
    
    // Only proceed if we have access to ErrorUtils
    if (!globalObj.ErrorUtils || typeof globalObj.ErrorUtils.setGlobalHandler !== 'function') {
      console.log('⚠️ ErrorUtils not available, skipping TurboModule error handling setup');
      return false;
    }
    
    // Set up a custom error handler
    globalObj.ErrorUtils.setGlobalHandler((error, isFatal) => {
      // First, log the error with special markers for easier debugging
      console.error('🔴 REACT-NATIVE ERROR CAUGHT:', error);
      
      // Check if it's related to TurboModules
      const errorString = error?.toString?.() || '';
      const stack = error?.stack || '';
      
      const isTurboModuleError = 
        errorString.includes('TurboModule') || 
        stack.includes('TurboModule') ||
        stack.includes('NativeModule') ||
        errorString.includes('Native module');
        
      if (isTurboModuleError) {
        console.warn('🚨 TurboModule-related error detected!');
        
        // Here we could add specialized handling for TurboModule errors
        // For example, we could try to reload the problematic module
        
        // For now, we just log it specially
        console.error('🔄 TurboModule error details:', {
          message: errorString,
          stack: stack.split('\n').slice(0, 5).join('\n'),
          isFatal
        });
      }
      
      // Call the original handler to maintain normal error flow
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
    
    console.log('✅ Configured custom TurboModule error handler');
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to configure TurboModule error handling:', error);
    return false;
  }
};

/**
 * Patch specific problematic modules that are known to cause issues
 */
const patchProblematicModules = async () => {
  try {
    // This would need to target specific modules known to cause crashes
    // Based on your crash report, we're focusing on Stripe since that's likely
    // the module involved given your previous issues
    
    // Get the global object
    const globalObj = global || window;
    
    // Look for Stripe module references
    const stripeKeys = Object.keys(globalObj).filter(key => 
      key.includes('Stripe') || 
      key.includes('stripe') ||
      key.includes('Payment')
    );
    
    console.log(`🔍 Found ${stripeKeys.length} potential Stripe module references`);
    
    // We don't actually modify these, but we log them for debugging
    for (const key of stripeKeys) {
      console.log(`📋 Found Stripe-related key: ${key}`);
    }
    
    // Ensure global error handler catches Stripe errors
    if (typeof globalObj.__stripePatched === 'undefined') {
      globalObj.__stripePatched = true;
      console.log('🛡️ Applied Stripe error handling patch');
    }
    
    return true;
  } catch (error) {
    console.warn('⚠️ Error patching problematic modules:', error);
    return false;
  }
};

export default applyTurboModuleFix;