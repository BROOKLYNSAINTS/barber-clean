// src/services/firebaseEnvironment.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { FIREBASE } from '@/config/env';
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
  const extra = Constants.expoConfig?.extra || {};
  // Check BOTH conditions to be safe
  return extra.isTestFlight === true || extra.buildType === 'preview';
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

// Get Firebase config from app.config.js (which gets it from EAS secrets)
const devConfigFromExpo = Constants.expoConfig?.extra?.firebaseDevConfig;

/**
 * Get the appropriate Firebase configuration based on the current environment and settings
 * 
 * In development: Use preference setting or default test config (barber-38b88)
 * In TestFlight: Always use test config (barber-38b88)
 * In App Store: Always use production config (barberapp-prod-2d197)
 */
const getFirebaseConfig = () => {
  try {
    // Get config from app.config.js
    const extra = Constants.expoConfig?.extra || {};
    
    console.log('🔥 Using development Firebase config from environment variables');
    
    // First try to get from app.config.js, otherwise use environment variables directly
    return extra.firebaseDevConfig || {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_DEV_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_DEV_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_DEV_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_DEV_STORAGE_BUCKET || undefined,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_DEV_MESSAGING_SENDER_ID || undefined,
      appId: process.env.EXPO_PUBLIC_FIREBASE_DEV_APP_ID || undefined
    };
  } catch (error) {
    console.error('Error getting Firebase config:', error);
    throw new Error('Failed to load Firebase configuration');
  }
};

export default getFirebaseConfig;
