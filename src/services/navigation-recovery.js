// navigation-recovery.js - Fix navigation-related issues
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

/**
 * NavigationRecovery - Fixes common navigation-related issues
 * Addresses problems with:
 * - Corrupted navigation state
 * - Deep linking issues
 * - Screen transition problems
 * - Route history corruption
 */
export const recoverNavigation = async () => {
  console.log('🧭 Recovering navigation system...');
  let results = {
    navigationStateCleared: false,
    routeHistoryCleared: false,
    redirectedToSafePage: false
  };

  try {
    // 1. Clear any stored navigation state
    await clearNavigationState();
    results.navigationStateCleared = true;

    // 2. Clear route history
    await clearRouteHistory();
    results.routeHistoryCleared = true;

    // 3. Redirect to a safe page if needed
    // This should be done by the caller since we don't want to
    // navigate while in the middle of a fix operation

    console.log('✅ Navigation system recovery completed:', results);
    return {
      success: true,
      ...results
    };
  } catch (error) {
    console.error('❌ Navigation recovery failed:', error);
    return {
      success: false,
      error: error.message,
      ...results
    };
  }
};

/**
 * Clear any stored navigation state from AsyncStorage
 */
const clearNavigationState = async () => {
  const allKeys = await AsyncStorage.getAllKeys();
  
  // Find and remove any navigation-related keys
  const navKeys = allKeys.filter(key => 
    key.includes('navigation') || 
    key.includes('route') || 
    key.includes('screen') ||
    key.includes('nav-state') ||
    key.includes('expo-router') ||
    key.includes('expo-linking')
  );

  if (navKeys.length > 0) {
    console.log(`🧹 Clearing ${navKeys.length} navigation related items`);
    await AsyncStorage.multiRemove(navKeys);
    return true;
  } else {
    console.log('ℹ️ No navigation data to clear');
    return false;
  }
};

/**
 * Clear any stored route history
 */
const clearRouteHistory = async () => {
  try {
    // Clear history in expo-router (if possible)
    // Note: This is implementation dependent on expo-router version
    
    // For now, let's clear any potential route history in AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    const historyKeys = allKeys.filter(key => 
      key.includes('history') || 
      key.includes('router-') || 
      key.includes('expo-router:history') ||
      key.includes('route-history')
    );

    if (historyKeys.length > 0) {
      await AsyncStorage.multiRemove(historyKeys);
      console.log(`🗂️ Reset ${historyKeys.length} route history items`);
      return true;
    }
    
    console.log('ℹ️ No route history to reset');
    return false;
  } catch (error) {
    console.warn('⚠️ Failed to reset route history:', error);
    return false;
  }
};

/**
 * Navigate to a safe screen (typically the login or home screen)
 */
export const navigateToSafeScreen = (screen = '/(auth)/login') => {
  try {
    console.log(`🔄 Navigating to safe screen: ${screen}`);
    router.replace(screen);
    return true;
  } catch (error) {
    console.error('❌ Failed to navigate to safe screen:', error);
    return false;
  }
};

export default recoverNavigation;