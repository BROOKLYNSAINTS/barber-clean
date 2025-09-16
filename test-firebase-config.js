// test-firebase-config.js
// Script to test Firebase configuration and verify environment settings
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from './src/services/firebaseEnvironment.js';

// This script helps debug Firebase configuration issues

console.log('\n🔍 FIREBASE CONFIGURATION TEST\n');
console.log('📱 Platform:', Platform.OS, Platform.Version);
console.log('🏠 Environment:', __DEV__ ? 'Development' : 'Production');

// Show expo config values
console.log('\n📋 Expo Configuration:');
console.log('- isTestFlight:', Constants?.expoConfig?.extra?.isTestFlight);
console.log('- buildType:', Constants?.expoConfig?.extra?.buildType);

// Show Firebase config
console.log('\n🔥 Firebase Configuration:');
console.log('- apiKey:', firebaseConfig.apiKey ? 'Valid key present' : 'MISSING');
console.log('- projectId:', firebaseConfig.projectId);
console.log('- authDomain:', firebaseConfig.authDomain);

// Check environment variables
console.log('\n🔑 Environment Variables:');
const devApiKey = process.env.FIREBASE_DEV_API_KEY || Constants?.expoConfig?.extra?.FIREBASE_DEV_API_KEY;
const prodApiKey = process.env.FIREBASE_PROD_API_KEY || Constants?.expoConfig?.extra?.FIREBASE_PROD_API_KEY;
console.log('- FIREBASE_DEV_API_KEY:', devApiKey ? 'Present' : 'MISSING');
console.log('- FIREBASE_PROD_API_KEY:', prodApiKey ? 'Present' : 'MISSING');

// Function to check Firebase configuration
const checkFirebaseConfig = async () => {
  try {
    // Get stored preferences
    const useProductionDb = await AsyncStorage.getItem('useProductionDatabase');
    const simulateTestFlight = await AsyncStorage.getItem('simulateTestFlight');
    const simulateAppStore = await AsyncStorage.getItem('simulateAppStore');
    
    console.log('\n⚙️ Stored Preferences:');
    console.log('- useProductionDatabase:', useProductionDb);
    console.log('- simulateTestFlight:', simulateTestFlight);
    console.log('- simulateAppStore:', simulateAppStore);
    
    // Final analysis
    console.log('\n📊 Configuration Analysis:');
    
    // Check if we're using the correct Firebase config
    const usingProd = firebaseConfig.projectId === 'barberapp-prod-2d197';
    const usingDev = firebaseConfig.projectId === 'barber-38b88';
    
    console.log('- Using database:', usingProd ? 'PRODUCTION' : (usingDev ? 'DEVELOPMENT' : 'UNKNOWN'));
    
    // Check if we have a mismatch between environment and config
    const isTestFlight = Constants?.expoConfig?.extra?.isTestFlight;
    if (isTestFlight && usingProd) {
      console.log('❌ WARNING: TestFlight build is using PRODUCTION database!');
      console.log('   TestFlight builds should use the DEVELOPMENT database.');
    }
    
    if (!isTestFlight && !__DEV__ && !usingProd) {
      console.log('❌ WARNING: App Store build is using DEVELOPMENT database!');
      console.log('   App Store builds should use the PRODUCTION database.');
    }
    
    // Final conclusion
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      console.log('✅ Firebase configuration looks valid.');
    } else {
      console.log('❌ Firebase configuration is INVALID or INCOMPLETE.');
    }
  } catch (error) {
    console.error('❌ Error checking Firebase configuration:', error);
  }
};

// Run the check
checkFirebaseConfig();
