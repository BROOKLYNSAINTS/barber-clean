// src/services/firebaseConfigManager.js
import { Platform } from 'react-native';
import * as Constants from 'expo-constants';
import devConfig from './firebaseConfig'; // Import test environment config
import AsyncStorage from '@react-native-async-storage/async-storage';

// By default, we use the development database for testing
// Set this to true to force using the production database during local development
let useProductionDb = false;

/**
 * Determine if this is a production App Store release
 * We only want to use production database for actual App Store releases, not TestFlight
 */
const isAppStoreRelease = () => {
  // Only App Store production builds should use production database
  if (__DEV__) {
    return false; // Development build
  }
  
  // Try to detect if this is a TestFlight build
  const isTestFlight = Constants?.manifest?.extra?.isTestFlight ||
    Constants?.expoConfig?.extra?.isTestFlight ||
    (Constants?.appOwnership === 'expo' && !__DEV__);
  
  // Check for build channel/type
  const buildType = Constants?.manifest?.extra?.buildType ||
    Constants?.expoConfig?.extra?.buildType ||
    'unknown';
    
  // For React Native without Expo
  const appStoreReceiptURL = global?.RNAppStoreReceipt || '';
  const isActualTestFlight = appStoreReceiptURL.includes('sandboxReceipt');
  
  // Only use production database when NOT in TestFlight AND NOT in development
  const usesProdDb = !isTestFlight && !isActualTestFlight && !__DEV__ && buildType === 'app-store';
  
  console.log(`📱 Build Environment Check:
    __DEV__: ${__DEV__}
    isTestFlight: ${isTestFlight}
    buildType: ${buildType}
    Using production DB: ${usesProdDb}`);
    
  return usesProdDb;
};

/**
 * Set which Firebase configuration to use (test or production)
 * This is useful for testing the production database in development
 * 
 * @param {boolean} useProduction - If true, use production database; if false, use test database
 */
export const setUseProductionDatabase = async (useProduction) => {
  // Only allow setting in development mode
  if (!__DEV__) {
    console.log('⚠️ Cannot change database in production/TestFlight builds');
    return;
  }
  
  useProductionDb = useProduction;
  
  // Save the preference for future app launches
  try {
    await AsyncStorage.setItem('useProductionDatabase', useProduction ? 'true' : 'false');
    console.log(`🔄 Firebase database preference set to: ${useProduction ? 'PRODUCTION' : 'TEST'}`);
  } catch (error) {
    console.error('❌ Failed to save database preference:', error);
  }
  
  // Log which database we're now using
  const config = useProductionDb ? prodConfig : devConfig;
  console.log(`🔥 Now using ${useProductionDb ? 'PRODUCTION' : 'TEST'} Firebase database`);
  console.log(`��️ Project ID: ${config.projectId}`);
};

/**
 * Get the appropriate Firebase configuration based on the current environment and settings
 * 
 * In development: Use preference setting or default test config (barber-38b88)
 * In TestFlight: Always use test config (barber-38b88)
 * In App Store: Always use production config (barberapp-prod-2d197)
 */
export const getFirebaseConfig = () => {
  // Check if this is a true production App Store release
  if (isAppStoreRelease()) {
    console.log('📱 APP STORE RELEASE: Using production Firebase config (barberapp-prod-2d197)');
    return prodConfig;
  }
  
  // In TestFlight, always use test database
  if (!__DEV__) {
    console.log('🧪 TESTFLIGHT BUILD: Using TEST Firebase config (barber-38b88)');
    return devConfig;
  }
  
  // In local development, use the selected database based on preference
  if (useProductionDb) {
    console.log('🔧 DEVELOPMENT BUILD: Using PRODUCTION Firebase config (barberapp-prod-2d197)');
    return prodConfig;
  } else {
    console.log('🔧 DEVELOPMENT BUILD: Using TEST Firebase config (barber-38b88)');
    return devConfig;
  }
};

// Log the current Firebase configuration details for debugging
const logFirebaseEnvironment = () => {
  const config = getFirebaseConfig();
  
  let environment = 'DEVELOPMENT BUILD';
  if (!__DEV__) {
    environment = isAppStoreRelease() ? 'APP STORE RELEASE' : 'TESTFLIGHT BUILD';
  }
  
  const database = config.projectId === 'barberapp-prod-2d197' ? 'PRODUCTION DATABASE' : 'TEST DATABASE';
  
  console.log(`🔥 Firebase Environment: ${environment}`);
  console.log(`📊 Using Database: ${database} (${config.projectId})`);
  console.log(`🔑 Using API Key: ${config.apiKey ? config.apiKey.substring(0, 8) + '...' : 'MISSING'}`);
  console.log(`🌐 Auth Domain: ${config.authDomain}`);
  console.log(`🏗️ Project ID: ${config.projectId}`);
};

// Try to load the saved preference when the module is imported
(async () => {
  try {
    if (__DEV__) { // Only in development mode
      const savedPreference = await AsyncStorage.getItem('useProductionDatabase');
      if (savedPreference === 'true') {
        useProductionDb = true;
        console.log('⚠️ Using PRODUCTION database in development environment (saved preference)');
      }
    }
  } catch (error) {
    console.warn('Could not load saved database preference:', error);
  } finally {
    // Run logging automatically when this module is imported
    logFirebaseEnvironment();
  }
})();

// Export everything needed
export default getFirebaseConfig();
export { useProductionDb };
