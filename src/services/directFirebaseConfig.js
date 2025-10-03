import Constants from 'expo-constants';

export const getDirectFirebaseConfig = (environment) => {
  // Get configs from app.config.js extra
  const extra = Constants?.expoConfig?.extra || {};
  const devConfig = extra.firebaseDevConfig || {};
  const prodConfig = extra.firebaseProdConfig || {};
  
  if (environment === 'development') {
    // Use development configuration - with no hardcoded sensitive values
    return {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_DEV_API_KEY || devConfig.apiKey,
      authDomain: devConfig.authDomain,
      projectId: devConfig.projectId,
      storageBucket: devConfig.storageBucket,
      messagingSenderId: devConfig.messagingSenderId,
      appId: devConfig.appId,
      measurementId: devConfig.measurementId
    };
  } else {
    // Use production configuration - with no hardcoded sensitive values
    return {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_PROD_API_KEY,
      authDomain: prodConfig.authDomain,
      projectId: prodConfig.projectId,
      storageBucket: prodConfig.storageBucket,
      messagingSenderId: prodConfig.messagingSenderId,
      appId: prodConfig.appId,
      measurementId: prodConfig.measurementId
    };
  }
};