import Constants from 'expo-constants';

const extra = (Constants?.expoConfig && Constants.expoConfig.extra) || {};
export const getEnv = (key, def = '') => (extra[key] ?? def);

export const STRIPE_PUBLISHABLE_KEY = getEnv('STRIPE_PUBLISHABLE_KEY', '');

export const FIREBASE = {
  API_KEY: getEnv('FIREBASE_API_KEY', ''),
  AUTH_DOMAIN: getEnv('FIREBASE_AUTH_DOMAIN', ''),
  PROJECT_ID: getEnv('FIREBASE_PROJECT_ID', ''),
  STORAGE_BUCKET: getEnv('FIREBASE_STORAGE_BUCKET', ''),
  MESSAGING_SENDER_ID: getEnv('FIREBASE_MESSAGING_SENDER_ID', ''),
  APP_ID: getEnv('FIREBASE_APP_ID', ''),
  MEASUREMENT_ID: getEnv('FIREBASE_MEASUREMENT_ID', '')
};