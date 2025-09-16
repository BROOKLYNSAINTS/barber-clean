// src/services/firebaseEnvironment.js
import { Platform } from 'react-native';
import * as Constants from 'expo-constants';
import devConfig from './firebaseConfig'; // Import test environment config
import prodConfig from './firebaseConfig.prod'; // Import production environment config
import AsyncStorage from '@react-native-async-storage/async-storage';

// By default, we use the development database for testing
// Set this to true to force using the production database during local development
let useProductionDb = false;

// Environment simulation variables
let simulateTestFlight = false;
let simulateAppStore = false;

/**
 * Determine if this is a production App Store release
 * We only want to use production database for actual App Store releases, not TestFlight
 */
const isAppStoreRelease = () => {
  // For environment simulation
  if (__DEV__ && simulateAppStore) {
    console.log('🔧 Simulating App Store environment');
    return true;
  }
  
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
  
  // Check if this is a preview build (EAS profile: preview)
  const isPreviewBuild = buildType === 'preview';
  
  // Only use production database when NOT in TestFlight AND NOT in development AND NOT in preview builds
  const usesProdDb = !isTestFlight && !isActualTestFlight && !isPreviewBuild && !__DEV__ && buildType === 'app-store';
  
  console.log(`📱 Build Environment Check:
    __DEV__: ${__DEV__}
    isTestFlight: ${isTestFlight}
    isPreviewBuild: ${isPreviewBuild}
    buildType: ${buildType}
    Using production DB: ${usesProdDb}`);
    
  return usesProdDb;
};

/**
 * Determine if this is a TestFlight build
 */
const isTestFlightBuild = () => {
  // For environment simulation
  if (__DEV__ && simulateTestFlight) {
    console.log('🔧 Simulating TestFlight environment');
    return true;
  }
  
  // Check if this is a TestFlight build or Preview build (which should use dev database)
  if (!__DEV__) {
    // Try to detect if this is a TestFlight build
    const isTestFlight = Constants?.manifest?.extra?.isTestFlight ||
      Constants?.expoConfig?.extra?.isTestFlight;
      
    // Check for build channel/type (preview builds should use dev database)
    const buildType = Constants?.manifest?.extra?.buildType ||
      Constants?.expoConfig?.extra?.buildType ||
      'unknown';
    const isPreviewBuild = buildType === 'preview';
      
    // For React Native without Expo
    const appStoreReceiptURL = global?.RNAppStoreReceipt || '';
    const isActualTestFlight = appStoreReceiptURL.includes('sandboxReceipt');
    
    return isTestFlight || isActualTestFlight || isPreviewBuild;
  }
  
  return false;
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
  simulateTestFlight = false;
  simulateAppStore = false;
  
  // Save the preference for future app launches
  try {
    await AsyncStorage.setItem('useProductionDatabase', useProduction ? 'true' : 'false');
    await AsyncStorage.setItem('simulateTestFlight', 'false');
    await AsyncStorage.setItem('simulateAppStore', 'false');
    console.log(`🔄 Firebase database preference set to: ${useProduction ? 'PRODUCTION' : 'TEST'}`);
  } catch (error) {
    console.error('❌ Failed to save database preference:', error);
  }
  
  // Log which database we're now using
  const config = useProductionDb ? prodConfig : devConfig;
  console.log(`🔥 Now using ${useProductionDb ? 'PRODUCTION' : 'TEST'} Firebase database`);
  console.log(`🏗️ Project ID: ${config.projectId}`);
};

/**
 * Set whether to simulate TestFlight environment
 * This will force using the test database as TestFlight builds do
 * 
 * @param {boolean} simulate - If true, simulate TestFlight environment
 */
export const setSimulateTestFlight = async (simulate) => {
  // Only allow setting in development mode
  if (!__DEV__) {
    console.log('⚠️ Cannot simulate environments in production builds');
    return;
  }
  
  simulateTestFlight = simulate;
  simulateAppStore = false;
  useProductionDb = false;
  
  try {
    await AsyncStorage.setItem('simulateTestFlight', simulate ? 'true' : 'false');
    await AsyncStorage.setItem('simulateAppStore', 'false');
    await AsyncStorage.setItem('useProductionDatabase', 'false');
    console.log(`🔄 TestFlight simulation ${simulate ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('❌ Failed to save environment simulation preference:', error);
  }
  
  console.log('🧪 Now simulating TestFlight environment: Using TEST Firebase config (barber-38b88)');
};

/**
 * Set whether to simulate App Store environment
 * This will force using the production database as App Store builds do
 * 
 * @param {boolean} simulate - If true, simulate App Store environment
 */
export const setSimulateAppStore = async (simulate) => {
  // Only allow setting in development mode
  if (!__DEV__) {
    console.log('⚠️ Cannot simulate environments in production builds');
    return;
  }
  
  simulateAppStore = simulate;
  simulateTestFlight = false;
  useProductionDb = false;
  
  try {
    await AsyncStorage.setItem('simulateAppStore', simulate ? 'true' : 'false');
    await AsyncStorage.setItem('simulateTestFlight', 'false');
    await AsyncStorage.setItem('useProductionDatabase', 'false');
    console.log(`🔄 App Store simulation ${simulate ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('❌ Failed to save environment simulation preference:', error);
  }
  
  console.log('📱 Now simulating App Store environment: Using PRODUCTION Firebase config (barberapp-prod-2d197)');
};

/**
 * Get the appropriate Firebase configuration based on the current environment and settings
 * 
 * In development: Use preference setting or default test config (barber-38b88)
 * In TestFlight: Always use test config (barber-38b88)
 * In App Store: Always use production config (barberapp-prod-2d197)
 */
export const getFirebaseConfig = () => {
  try {
    // First, validate the configurations to make sure they're valid
    const isDevConfigValid = devConfig && devConfig.apiKey && devConfig.projectId;
    const isProdConfigValid = prodConfig && prodConfig.apiKey && prodConfig.projectId;
    
    console.log(`🔍 Config validation - Dev: ${isDevConfigValid ? 'Valid' : 'INVALID'}, Prod: ${isProdConfigValid ? 'Valid' : 'INVALID'}`);
    
    // EMULATOR MODE: When working with local emulators, always use development config
    if (__DEV__ && devConfig.authDomain === 'localhost') {
      console.log('🧪 EMULATOR MODE: Using development config with localhost authDomain');
      return devConfig;
    }
    
    // If the required config isn't valid, throw an error to trigger fallback
    if (!isDevConfigValid && !isProdConfigValid) {
      throw new Error('Both dev and prod Firebase configs are invalid');
    }
    
    // If only one config is valid, use that regardless of environment
    if (!isDevConfigValid && isProdConfigValid) {
      console.log('⚠️ WARNING: Using production config because dev config is invalid');
      return prodConfig;
    }
    if (isDevConfigValid && !isProdConfigValid) {
      console.log('⚠️ WARNING: Using dev config because production config is invalid');
      return devConfig;
    }
    
    // Normal environment detection flow
    // Check if this is a true production App Store release or simulation
    if (isAppStoreRelease() || simulateAppStore) {
      console.log('📱 APP STORE RELEASE: Using production Firebase config (barberapp-prod-2d197)');
      return prodConfig;
    }
    
    // In TestFlight or TestFlight simulation, always use test database
    if (!__DEV__ || simulateTestFlight) {
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
  } catch (error) {
    console.error('❌ Error determining Firebase configuration:', error);
    
    // Get emergency fallback values from environment or use hard-coded values as last resort
    const fallbackConfig = {
      apiKey: process.env.FIREBASE_DEV_API_KEY || "AIzaSyD3FFprDwIZwECR5TkYCeOkiCUNGLp6qQM", 
      authDomain: process.env.FIREBASE_DEV_AUTH_DOMAIN || "barber-38b88.firebaseapp.com",
      projectId: process.env.FIREBASE_DEV_PROJECT_ID || "barber-38b88",
      storageBucket: process.env.FIREBASE_DEV_STORAGE_BUCKET || "barber-38b88.appspot.com",
      messagingSenderId: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID || "910680290414",
      appId: process.env.FIREBASE_DEV_APP_ID || "1:910680290414:web:606ee1c0e84c32e6bfcc8c",
      measurementId: process.env.FIREBASE_DEV_MEASUREMENT_ID || "G-B6HMP9YK92"
    };
    
    console.log('🆘 Using EMERGENCY FALLBACK Firebase config');
    return fallbackConfig;
  }
};

// Log the current Firebase configuration details for debugging
const logFirebaseEnvironment = () => {
  const config = getFirebaseConfig();
  
  let environment = 'DEVELOPMENT BUILD';
  if (!__DEV__) {
    environment = isAppStoreRelease() ? 'APP STORE RELEASE' : 'TESTFLIGHT BUILD';
  } else {
    if (simulateAppStore) {
      environment = 'APP STORE SIMULATION';
    } else if (simulateTestFlight) {
      environment = 'TESTFLIGHT SIMULATION';
    }
  }
  
  const database = config.projectId === 'barberapp-prod-2d197' ? 'PRODUCTION DATABASE' : 'TEST DATABASE';
  
  console.log(`🔥 Firebase Environment: ${environment}`);
  console.log(`📊 Using Database: ${database} (${config.projectId})`);
  console.log(`🔑 Using API Key: ${config.apiKey ? config.apiKey.substring(0, 8) + '...' : 'MISSING'}`);
  console.log(`🌐 Auth Domain: ${config.authDomain}`);
};

// Try to load the saved preference when the module is imported
(async () => {
  try {
    if (__DEV__) { // Only in development mode
      // Load saved preferences
      const savedProductionDb = await AsyncStorage.getItem('useProductionDatabase');
      const savedTestFlightSim = await AsyncStorage.getItem('simulateTestFlight');
      const savedAppStoreSim = await AsyncStorage.getItem('simulateAppStore');
      
      // Apply saved preferences
      if (savedProductionDb === 'true') {
        useProductionDb = true;
        console.log('⚠️ Using PRODUCTION database in development environment (saved preference)');
      }
      
      if (savedTestFlightSim === 'true') {
        simulateTestFlight = true;
        useProductionDb = false;
        console.log('⚠️ Simulating TestFlight environment (saved preference)');
      }
      
      if (savedAppStoreSim === 'true') {
        simulateAppStore = true;
        useProductionDb = false;
        simulateTestFlight = false;
        console.log('⚠️ Simulating App Store environment (saved preference)');
      }
    }
  } catch (error) {
    console.warn('Could not load saved environment preferences:', error);
  } finally {
    // Run logging automatically when this module is imported
    logFirebaseEnvironment();
  }
})();

// Create a safeguard function to ensure we never return undefined config
const getSafeFirebaseConfig = () => {
  try {
    const config = getFirebaseConfig();
    
    // Ensure we have a valid config object with required fields
    if (!config || !config.apiKey || !config.projectId) {
      console.error('❌ Invalid Firebase config detected. Missing required fields.');
      
      // If we don't have a valid config, fall back to the dev config which has hardcoded values
      console.log('🛟 Using fallback configuration (dev)');
      return devConfig;
    }
    
    return config;
  } catch (error) {
    console.error('❌ Error getting Firebase config:', error);
    console.log('🛟 Using fallback configuration (dev)');
    return devConfig;
  }
};

// Export everything needed with a safety wrapper
export default getSafeFirebaseConfig();
export { useProductionDb, simulateTestFlight, simulateAppStore };
