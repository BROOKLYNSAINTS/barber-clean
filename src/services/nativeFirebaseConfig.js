// src/services/nativeFirebaseConfig.js
import { Platform } from 'react-native';

// For iOS, Firebase will automatically use GoogleService-Info.plist
// For Android, it will use google-services.json
// We only need this config for web or as fallback
export const webFirebaseConfig = {
  apiKey: "AIzaSyD3FFprDwIZwECR5TkYCeOkiCUNGLp6qQM",
  authDomain: "barber-38b88.firebaseapp.com",
  projectId: "barber-38b88",
  storageBucket: "barber-38b88.appspot.com",
  messagingSenderId: "910680290414",
  appId: "1:910680290414:web:606ee1c0e84c32e6bfcc8c",
  measurementId: "G-B6HMP9YK92"
};

/**
 * In production native apps, Firebase should use the GoogleService-Info.plist 
 * or google-services.json automatically. This function provides a fallback
 * for development and web environments.
 */
export const getFirebaseConfig = () => {
  // Use platform-specific config when in native environment
  const isNativeProduction = Platform.OS !== 'web' && !__DEV__;
  
  if (isNativeProduction) {
    console.log('📱 Using native Firebase configuration from GoogleService-Info.plist/google-services.json');
    // Return empty object to let Firebase use native config files
    return {};
  } else {
    console.log('🌐 Using web Firebase configuration');
    // Use web config for development and web
    return webFirebaseConfig;
  }
};

// Export the original web config for fallback and direct API use
export const firebaseConfig = webFirebaseConfig;
