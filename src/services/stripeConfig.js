// src/services/stripeConfig.js
// This file stores Stripe configuration for the app
import Constants from 'expo-constants';

const extra = (Constants?.expoConfig && Constants.expoConfig.extra) || {};

// Determine which environment we're in
const isProduction = !extra.isTestFlight && extra.buildType === 'production';
const isTestFlight = !!extra.isTestFlight || extra.buildType === 'preview';
const isDevelopment = !isProduction && !isTestFlight;

// Select the appropriate key based on environment
// For TestFlight and development, use the test key
// For production App Store release, use the live key
const publishableKey = isProduction 
  ? (extra.STRIPE_LIVE_PUBLISHABLE_KEY || '')
  : (extra.STRIPE_TEST_PUBLISHABLE_KEY || '');

export const stripeBackendUrl = extra.STRIPE_BACKEND_URL || '';

export const stripeConfig = {
  publishableKey,
  keyType: (publishableKey || '').startsWith('pk_test') ? 'TEST' : 'PRODUCTION',
  isTestFlight,
  buildType: extra.buildType || 'unknown'
};

// Use these helpers from screens when needed (don't run at import time)
export const stripeKeysPresent = () => !!stripeConfig.publishableKey;
export const describeStripeEnv = () => ({
  keyPrefix: stripeConfig.publishableKey ? stripeConfig.publishableKey.slice(0, 8) : '',
  keyType: stripeConfig.keyType,
  isTestFlight: stripeConfig.isTestFlight,
  buildType: stripeConfig.buildType
});

// Debug
console.log(`🔧 Stripe config: using ${stripeConfig.keyType} keys in ${isProduction ? 'PRODUCTION' : (isTestFlight ? 'TESTFLIGHT' : 'DEVELOPMENT')}`);
