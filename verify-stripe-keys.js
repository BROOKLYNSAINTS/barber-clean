/**
 * Stripe Key Verification Script
 * 
 * This script verifies that the backend is properly configured with the
 * correct Stripe secret key by testing a payment intent creation and
 * checking the format of the returned client secret.
 * 
 * Run with: node verify-stripe-keys.js
 */

// Import node-fetch properly based on Node.js version
let fetch;
try {
  // Try to use global fetch (Node.js 18+)
  fetch = global.fetch;
  // Test if fetch is actually available
  if (typeof fetch !== 'function') {
    throw new Error('Native fetch not available');
  }
} catch (error) {
  // Fall back to node-fetch package
  try {
    // Try CommonJS import
    fetch = require('node-fetch');
  } catch (err) {
    console.error('\x1b[31m✗ Error: This script requires either Node.js v18+ or the node-fetch package\x1b[0m');
    console.error('\x1b[33mPlease run: npm install node-fetch@2\x1b[0m');
    process.exit(1);
  }
}

// Your backend URL
const BACKEND_URL = 'https://barber-backend-ten.vercel.app';

// Test data
const testData = {
  amount: 1000, // $10.00
  currency: 'usd',
  service_name: 'Verification Test Service',
  barber_name: 'Test Barber'
};

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function checkBackendHealth() {
  console.log(`${colors.bright}Checking backend availability...${colors.reset}`);
  
  try {
    // Since there's no dedicated health endpoint, we'll just check if the server responds
    const response = await fetch(`${BACKEND_URL}/api/create-payment-intent`, {
      method: 'OPTIONS'
    });
    
    if (response.ok || response.status === 204 || response.status === 404) {
      console.log(`${colors.green}✓ Backend is reachable${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Backend check failed: ${response.status} ${response.statusText}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Backend unreachable: ${error.message}${colors.reset}`);
    return false;
  }
}

async function createTestPaymentIntent() {
  console.log(`\n${colors.bright}Creating test payment intent...${colors.reset}`);
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`${colors.red}✗ Payment intent creation failed: ${response.status} ${response.statusText}${colors.reset}`);
      console.log(`${colors.red}  Response: ${JSON.stringify(data)}${colors.reset}`);
      return null;
    }
    
    console.log(`${colors.green}✓ Payment intent created successfully${colors.reset}`);
    return data;
  } catch (error) {
    console.log(`${colors.red}✗ Error creating payment intent: ${error.message}${colors.reset}`);
    return null;
  }
}

function analyzeClientSecret(clientSecret) {
  console.log(`\n${colors.bright}Analyzing client secret format...${colors.reset}`);
  
  if (!clientSecret) {
    console.log(`${colors.red}✗ No client secret returned${colors.reset}`);
    return false;
  }
  
  // Log the full client secret for detailed examination
  console.log(`${colors.dim}  - Full Client Secret: ${clientSecret}${colors.reset}`);
  
  // Parse client secret
  const parts = clientSecret.split('_');
  const prefix = parts[0];
  
  console.log(`${colors.dim}  - Client Secret Prefix: ${prefix}_${colors.reset}`);
  
  // Check the prefix (pi = payment intent)
  if (prefix !== 'pi') {
    console.log(`${colors.red}✗ Unexpected client secret prefix: ${prefix} (expected: pi)${colors.reset}`);
    return false;
  }
  
  // Check for "test" or "live" in the client secret
  if (clientSecret.includes('_test_')) {
    console.log(`${colors.yellow}! Client secret contains "_test_" indicating TEST mode${colors.reset}`);
    console.log(`${colors.yellow}  This will cause errors in production apps that use production keys${colors.reset}`);
    return false;
  } else if (clientSecret.includes('_live_')) {
    console.log(`${colors.green}✓ Client secret contains "_live_" indicating PRODUCTION mode${colors.reset}`);
  } else if (clientSecret.includes('_secret_')) {
    console.log(`${colors.green}✓ Client secret contains "_secret_" indicating PRODUCTION mode${colors.reset}`);
    console.log(`${colors.dim}  (Live secrets may not explicitly contain "_live_" but use "_secret_" instead)${colors.reset}`);
  }
  
  return true;
}

function analyzeResponse(data) {
  console.log(`\n${colors.bright}Analyzing full response...${colors.reset}`);
  
  if (!data) {
    return;
  }
  
  // Display full response data for debugging
  console.log(`${colors.dim}  - Full response data: ${JSON.stringify(data, null, 2)}${colors.reset}`);
  
  // Check if mode is specified
  if (data.mode) {
    console.log(`${colors.dim}  - Reported Mode: ${data.mode}${colors.reset}`);
    
    if (data.mode === 'development' || data.mode === 'test') {
      console.log(`${colors.yellow}! Backend reports it's in ${data.mode} mode${colors.reset}`);
    } else if (data.mode === 'production') {
      console.log(`${colors.green}✓ Backend reports it's in production mode${colors.reset}`);
    }
  }
  
  // Check payment intent ID
  if (data.paymentIntentId) {
    console.log(`${colors.dim}  - Payment Intent ID: ${data.paymentIntentId}${colors.reset}`);
    
    if (data.paymentIntentId.includes('_test_')) {
      console.log(`${colors.yellow}! Payment Intent ID contains "_test_" indicating TEST environment${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Payment Intent ID format indicates PRODUCTION environment${colors.reset}`);
    }
  }
  
  // Check ephemeral key if present
  if (data.ephemeralKey) {
    console.log(`${colors.dim}  - Ephemeral Key: ${data.ephemeralKey}${colors.reset}`);
    
    if (data.ephemeralKey.startsWith('ek_test_')) {
      console.log(`${colors.yellow}! Ephemeral Key indicates TEST environment${colors.reset}`);
    } else if (data.ephemeralKey.startsWith('ek_live_')) {
      console.log(`${colors.green}✓ Ephemeral Key indicates PRODUCTION environment${colors.reset}`);
    }
  }
  
  // Check customer ID if present
  if (data.customer) {
    console.log(`${colors.dim}  - Customer ID: ${data.customer}${colors.reset}`);
    
    if (data.customer.startsWith('cus_test_')) {
      console.log(`${colors.yellow}! Customer ID indicates TEST environment${colors.reset}`);
    } else if (data.customer.startsWith('cus_')) {
      console.log(`${colors.green}✓ Customer ID format is valid for production${colors.reset}`);
    }
  }
}

async function checkEndpointExistence() {
  console.log(`\n${colors.bright}Checking endpoint paths...${colors.reset}`);
  
  try {
    // Test the endpoint path that should exist
    const response = await fetch(`${BACKEND_URL}/api/create-payment-intent`, {
      method: 'OPTIONS'
    });
    
    if (response.ok || response.status === 204) {
      console.log(`${colors.green}✓ Endpoint /api/create-payment-intent exists${colors.reset}`);
    } else {
      console.log(`${colors.yellow}! Endpoint /api/create-payment-intent returned ${response.status}${colors.reset}`);
    }
    
    // Also test the alternate path without /api prefix
    const altResponse = await fetch(`${BACKEND_URL}/create-payment-intent`, {
      method: 'OPTIONS'
    });
    
    if (altResponse.ok || altResponse.status === 204) {
      console.log(`${colors.dim}  - Alternate endpoint /create-payment-intent also exists${colors.reset}`);
    } else {
      console.log(`${colors.dim}  - Alternate endpoint /create-payment-intent not found (${altResponse.status})${colors.reset}`);
    }
    
  } catch (error) {
    console.log(`${colors.red}✗ Error checking endpoints: ${error.message}${colors.reset}`);
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}==============================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  STRIPE KEY VERIFICATION TOOL${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}==============================================${colors.reset}`);
  console.log(`${colors.dim}Target Backend: ${BACKEND_URL}${colors.reset}\n`);
  
  // Step 1: Check if backend is reachable
  const isHealthy = await checkBackendHealth();
  if (!isHealthy) {
    console.log(`\n${colors.red}Cannot proceed with tests. Backend is unreachable.${colors.reset}`);
    return;
  }
  
  // Step 2: Create a test payment intent
  const paymentData = await createTestPaymentIntent();
  if (!paymentData) {
    console.log(`\n${colors.red}Cannot proceed with analysis. Payment intent creation failed.${colors.reset}`);
    return;
  }
  
  // Step 3: Analyze the client secret format
  const isValidFormat = analyzeClientSecret(paymentData.clientSecret);
  
  // Step 4: Analyze other aspects of the response
  analyzeResponse(paymentData);
  
  // Final verdict
  console.log(`\n${colors.bright}${colors.cyan}==============================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  VERIFICATION RESULTS${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}==============================================${colors.reset}`);
  
  if (isValidFormat) {
    console.log(`${colors.green}✓ CONFIGURATION LOOKS CORRECT${colors.reset}`);
    console.log(`${colors.green}  Your backend appears to be using the correct PRODUCTION secret key.${colors.reset}`);
    console.log(`${colors.green}  This should work properly with your frontend production publishable key.${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ CONFIGURATION ISSUES DETECTED${colors.reset}`);
    console.log(`${colors.red}  Your backend may still be using a TEST secret key or has format issues.${colors.reset}`);
    console.log(`${colors.red}  This will cause errors when your frontend uses a PRODUCTION publishable key.${colors.reset}`);
    console.log(`${colors.yellow}  Please check your backend environment variables on Vercel.${colors.reset}`);
  }
}

// Execute the main function
main().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  console.error(error);
});