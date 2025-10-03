// src/services/firebaseConfig.js
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get Firebase configuration from environment variables via app.config.js
const getFirebaseConfig = () => {
  const extra = Constants?.expoConfig?.extra || {};
  const isTestFlight = extra.isTestFlight === true;
  const buildType = extra.buildType || '';
  
  console.log(`📱 Build type: ${buildType}, TestFlight: ${isTestFlight ? 'Yes' : 'No'}`);
  
  // Always use dev config for TestFlight builds
  if (isTestFlight || buildType === 'preview' || buildType === 'development') {
    console.log('Using development Firebase config from environment');
    return extra.firebaseDevConfig || {};
  } else {
    console.log('Using production Firebase config from environment');
    return extra.firebaseProdConfig || {};
  }
};

// Validate the Firebase config before exporting it
const validateFirebaseConfig = (config) => {
  // Check for required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    console.error(`⚠️ Firebase config is missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Check API key format (should start with AIza)
  if (config.apiKey && !config.apiKey.startsWith('AIza')) {
    console.error('⚠️ Firebase API key appears to be in an invalid format (should start with AIza)');
  }
  
  // Log platform info for debugging
  console.log(`📱 Platform: ${Platform.OS}, Version: ${Platform.Version}`);
  console.log(`🏠 Environment: ${__DEV__ ? 'Development' : 'Production'}`);
  console.log(`🔑 API Key length: ${config.apiKey?.length || 0}`);
  
  return config;
};

// Export the validated config from environment variables
export const firebaseConfig = validateFirebaseConfig(getFirebaseConfig());
