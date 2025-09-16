// prebuild-check.js
// Run this script before building to verify configuration
// Usage: node prebuild-check.js

// Import configurations (CommonJS versions)
const { firebaseConfig } = require('./prebuild-firebase-config');
const { stripeConfig } = require('./prebuild-stripe-config');
const appConfig = require('./prebuild-app-config');

console.log('======== PRE-BUILD CONFIGURATION CHECK ========');
console.log('Checking for configuration consistency...');

// Check Firebase config
console.log('\n📱 FIREBASE CONFIGURATION CHECK:');
console.log('-----------------------------------');

// Check if firebaseConfig is properly initialized
if (!firebaseConfig || !firebaseConfig.apiKey) {
  console.error('❌ CRITICAL: firebaseConfig.js is missing or invalid');
  process.exit(1);
}

// Check app.config.js Firebase config
const appFirebaseApiKey = appConfig.default?.extra?.FIREBASE_API_KEY;
if (!appFirebaseApiKey) {
  console.error('❌ CRITICAL: app.config.js is missing Firebase API Key');
  process.exit(1);
}

// Check for consistency between files
console.log('Checking for consistency between config files...');

const configMatches = {
  'API Key': firebaseConfig.apiKey === appConfig.default.extra.FIREBASE_API_KEY,
  'Auth Domain': firebaseConfig.authDomain === appConfig.default.extra.FIREBASE_AUTH_DOMAIN,
  'Project ID': firebaseConfig.projectId === appConfig.default.extra.FIREBASE_PROJECT_ID,
  'Storage Bucket': firebaseConfig.storageBucket === appConfig.default.extra.FIREBASE_STORAGE_BUCKET,
  'Messaging Sender ID': firebaseConfig.messagingSenderId === appConfig.default.extra.FIREBASE_MESSAGING_SENDER_ID,
  'App ID': firebaseConfig.appId === appConfig.default.extra.FIREBASE_APP_ID,
  'Measurement ID': firebaseConfig.measurementId === appConfig.default.extra.FIREBASE_MEASUREMENT_ID
};

let hasConfigMismatch = false;

for (const [key, matches] of Object.entries(configMatches)) {
  if (matches) {
    console.log(`✅ ${key}: Values match between firebaseConfig.js and app.config.js`);
  } else {
    console.error(`❌ ${key}: MISMATCH between firebaseConfig.js and app.config.js`);
    hasConfigMismatch = true;
  }
}

if (hasConfigMismatch) {
  console.error('\n❌ CRITICAL: Firebase configuration mismatch between files!');
  console.error('Please ensure all Firebase config values match between firebaseConfig.js and app.config.js');
  process.exit(1);
}

// Check Stripe configuration
console.log('\n💳 STRIPE CONFIGURATION CHECK:');
console.log('-----------------------------');

if (!stripeConfig || !stripeConfig.publishableKey) {
  console.error('❌ CRITICAL: stripeConfig.js is missing or invalid');
  process.exit(1);
}

// In pre-build checking mode, we'll allow placeholder keys for now
// but warn the user that they should be replaced before production
if (stripeConfig.publishableKey === 'pk_test_your_stripe_key_here') {
  console.warn('⚠️ WARNING: Stripe publishable key is using a placeholder value');
  console.warn('You should replace it with your actual key in src/services/stripeConfig.js before final deployment');
}

// Check app.config.js Stripe config consistency
const appStripeKey = appConfig.default?.extra?.STRIPE_PUBLISHABLE_KEY;
if (appStripeKey === 'pk_test_your_stripe_key_here') {
  console.warn('⚠️ WARNING: Stripe publishable key in app.config.js is using a placeholder value');
  console.warn('You should replace it with your actual key before final deployment');
}

if (stripeConfig.publishableKey !== appStripeKey && appStripeKey !== undefined) {
  console.error('❌ CRITICAL: Stripe key mismatch between stripeConfig.js and app.config.js');
  console.error('Please ensure both files use the same key');
  process.exit(1);
} else {
  console.log('✅ Stripe configuration consistent between files');
}

// Check for environment variables that might cause issues
console.log('\n🔍 CHECKING FOR ENV VARIABLE USAGE:');
console.log('----------------------------------');

// This is a simplified check - you might need to extend it
const fs = require('fs');
const firebaseContent = fs.readFileSync('./src/services/firebase.js', 'utf8');
if (firebaseContent.includes('process.env.FIREBASE')) {
  console.warn('⚠️ Warning: firebase.js might still be using environment variables');
}

const stripeContent = fs.readFileSync('./src/services/stripe.js', 'utf8');
if (stripeContent.includes('process.env.STRIPE')) {
  console.warn('⚠️ Warning: stripe.js might still be using environment variables');
}

console.log('\n✅ All configuration checks passed!');
console.log('Your app is ready to build for TestFlight/Production');
console.log('================================================\n');
