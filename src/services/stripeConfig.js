// src/services/stripeConfig.js
// This file stores Stripe configuration for the app
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

// Determine if this is running in TestFlight (preview build)
// This matches the logic in app.config.js
const isTestFlight = Constants.expoConfig?.extra?.isTestFlight || false;
const buildType = Constants.expoConfig?.extra?.buildType || 'development';

// Log detailed environment information for debugging
console.log('🔍 STRIPE CONFIG - DETAILED ENVIRONMENT INFO:');
console.log('- App Name:', Constants.expoConfig?.name);
console.log('- Build Type:', buildType);
console.log('- Is TestFlight:', isTestFlight);
console.log('- App Version:', Application.nativeApplicationVersion);
console.log('- Build Version:', Application.nativeBuildVersion);
console.log('- Platform:', Device.osName, Device.osVersion);
console.log('- Device:', Device.modelName);
console.log('- Constants.appOwnership:', Constants.appOwnership); // Will be 'standalone' for TestFlight
console.log('- Constants.executionEnvironment:', Constants.executionEnvironment);
console.log('- Constants.expoVersion:', Constants.expoVersion);
console.log('- Constants Full Config:', JSON.stringify(Constants.expoConfig?.extra || {}, null, 2));

// Get Stripe configuration from environment variables via app.config.js
const stripeTestKey = Constants.expoConfig?.extra?.STRIPE_TEST_PUBLISHABLE_KEY || '';
const stripeLiveKey = Constants.expoConfig?.extra?.STRIPE_LIVE_PUBLISHABLE_KEY || '';
export const stripeBackendUrl = Constants.expoConfig?.extra?.STRIPE_BACKEND_URL || 'https://barber-backend-ten.vercel.app';
export const backendUrl = stripeBackendUrl; // For compatibility

// Validate key availability
if (!stripeTestKey || !stripeLiveKey) {
  console.error('⚠️ Stripe keys are missing from environment variables!');
  console.error('Please check your .env file and app.config.js configuration.');
}

// Configure Stripe keys
// IMPORTANT: For this app, all builds use the production keys
// Only the development build uses test keys for local testing
export const stripeConfig = {
  publishableKey: buildType === 'development' 
    ? stripeTestKey // Use test key from environment variables for development
    : stripeLiveKey, // Use live key from environment variables for production/TestFlight
  merchantIdentifier: Constants.expoConfig?.extra?.MERCHANT_IDENTIFIER || "merchant.com.barberapp",
  urlScheme: Constants.expoConfig?.extra?.URL_SCHEME || "barberapp",
  backendUrl: stripeBackendUrl // Include backendUrl for easy access
};

// Verify the backend URL is active and accessible
fetch(stripeBackendUrl + '/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend health check successful:', data);
  })
  .catch(error => {
    console.error('⚠️ Backend health check failed. The Stripe backend may be down:', error);
    console.error('Please ensure your Vercel deployment is active and responding.');
  });

// Log the selected configuration
console.log('💳 Selected Stripe Configuration:');
console.log('- Using', buildType === 'development' ? 'TEST' : 'PRODUCTION', 'keys');
console.log('- Key Prefix:', stripeConfig.publishableKey.substring(0, 7));
console.log('- TestFlight builds are configured to use PRODUCTION keys');

// Important: The above values should match your Stripe project
// The publishable key is public and meant to be included in client code
