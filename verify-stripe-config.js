/**
 * Stripe Configuration Verifier
 * Run this script to check if your Stripe configuration is correct
 */

// Load environment variables
require('dotenv').config();

console.log("🔍 STRIPE CONFIGURATION VERIFICATION");
console.log("------------------------------------");

// Check for Stripe keys
const stripeTestKey = process.env.STRIPE_TEST_PUBLISHABLE_KEY;
const stripeLiveKey = process.env.STRIPE_LIVE_PUBLISHABLE_KEY;
const stripeBackendUrl = process.env.STRIPE_BACKEND_URL;

console.log("\nSTRIPE PUBLISHABLE KEYS:");
console.log("- Test Key:", stripeTestKey ? 
  `Present (${stripeTestKey.substring(0, 12)}...)` : 
  "❌ MISSING");
console.log("- Live Key:", stripeLiveKey ? 
  `Present (${stripeLiveKey.substring(0, 12)}...)` : 
  "❌ MISSING");

// Verify key formats
if (stripeTestKey && !stripeTestKey.startsWith('pk_test_')) {
  console.log("⚠️ WARNING: Test key doesn't start with 'pk_test_'");
}

if (stripeLiveKey && !stripeLiveKey.startsWith('pk_live_')) {
  console.log("⚠️ WARNING: Live key doesn't start with 'pk_live_'");
}

console.log("\nBACKEND CONFIGURATION:");
console.log("- Backend URL:", stripeBackendUrl || "❌ MISSING");

console.log("\nEXPO CONFIG CHECK:");
try {
  const appConfig = require('./app.config');
  console.log("- app.config.js loaded successfully");
  
  // Check extra variables
  const extra = appConfig.extra || {};
  console.log("- Extra variables present:", Object.keys(extra).length > 0 ? "Yes" : "No");
  
  if (extra.stripePublishableKey) {
    console.log("- Stripe key in app.config:", extra.stripePublishableKey.substring(0, 12) + "...");
  } else {
    console.log("- Stripe key in app.config: ❌ MISSING");
  }
  
  if (extra.stripeBackendUrl) {
    console.log("- Backend URL in app.config:", extra.stripeBackendUrl);
  } else {
    console.log("- Backend URL in app.config: ❌ MISSING");
  }
  
  // Check plugins
  const plugins = appConfig.plugins || [];
  const withEnvPlugin = plugins.find(p => 
    typeof p === 'string' && p === 'expo-env' || 
    (Array.isArray(p) && p[0] === 'expo-env')
  );
  console.log("- expo-env plugin:", withEnvPlugin ? "Present" : "❌ MISSING");
  
} catch (error) {
  console.error("❌ Error loading app.config.js:", error.message);
}

console.log("\nCONFIGURATION VERIFICATION COMPLETE");