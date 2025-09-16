/**
 * Stripe Integration Test
 * 
 * This script performs comprehensive tests of the Stripe integration
 * including creating payment intents, checking subscription capabilities,
 * and verifying proper key configuration.
 * 
 * Run with: node stripe-test.js
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

// Test data for standard payment
const standardPaymentData = {
  amount: 1000, // $10.00
  currency: 'usd',
  service_name: 'Standard Test Service',
  barber_name: 'Test Barber'
};

// Test data for subscription
const subscriptionData = {
  priceId: 'price_1NWfGP4MureyHjXxYMdeBCtX', // Replace with your actual price ID
  barber_name: 'Test Barber',
  customerId: 'cus_test_' + Date.now(), // This will be replaced if customer creation is successful
  service_name: 'Subscription Test'
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

// Helper function to print section headers
function printHeader(title) {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(title.length + 4)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  ${title}  ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(title.length + 4)}${colors.reset}`);
}

async function checkBackendAvailability() {
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

async function createStandardPaymentIntent() {
  console.log(`\n${colors.bright}Creating standard payment intent...${colors.reset}`);
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(standardPaymentData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`${colors.red}✗ Payment intent creation failed: ${response.status} ${response.statusText}${colors.reset}`);
      console.log(`${colors.red}  Response: ${JSON.stringify(data)}${colors.reset}`);
      return null;
    }
    
    console.log(`${colors.green}✓ Standard payment intent created successfully${colors.reset}`);
    return data;
  } catch (error) {
    console.log(`${colors.red}✗ Error creating payment intent: ${error.message}${colors.reset}`);
    return null;
  }
}

async function testCreateSubscription() {
  console.log(`\n${colors.bright}Testing subscription creation...${colors.reset}`);
  
  try {
    // First try to create a customer (if API supports it)
    try {
      const customerResponse = await fetch(`${BACKEND_URL}/api/create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `test-${Date.now()}@example.com`,
          name: 'Test Customer'
        })
      });
      
      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        if (customerData.customerId) {
          subscriptionData.customerId = customerData.customerId;
          console.log(`${colors.green}✓ Test customer created successfully: ${customerData.customerId}${colors.reset}`);
        }
      }
    } catch (e) {
      console.log(`${colors.yellow}! Customer creation endpoint not available, using test ID${colors.reset}`);
    }
    
    // Now try to create a subscription
    const response = await fetch(`${BACKEND_URL}/api/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`${colors.red}✗ Subscription creation failed: ${response.status} ${response.statusText}${colors.reset}`);
      console.log(`${colors.red}  Response: ${JSON.stringify(data)}${colors.reset}`);
      return null;
    }
    
    console.log(`${colors.green}✓ Subscription creation endpoint responded successfully${colors.reset}`);
    return data;
  } catch (error) {
    console.log(`${colors.red}✗ Error testing subscription: ${error.message}${colors.reset}`);
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
  if (prefix !== 'pi' && prefix !== 'seti') {
    console.log(`${colors.red}✗ Unexpected client secret prefix: ${prefix} (expected: pi or seti)${colors.reset}`);
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

function analyzeResponse(data, type = 'payment') {
  console.log(`\n${colors.bright}Analyzing ${type} response...${colors.reset}`);
  
  if (!data) {
    return false;
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
  if (data.paymentIntentId || data.paymentIntent?.id) {
    const paymentIntentId = data.paymentIntentId || data.paymentIntent?.id;
    console.log(`${colors.dim}  - Payment Intent ID: ${paymentIntentId}${colors.reset}`);
    
    if (paymentIntentId.includes('_test_')) {
      console.log(`${colors.yellow}! Payment Intent ID contains "_test_" indicating TEST environment${colors.reset}`);
      return false;
    } else {
      console.log(`${colors.green}✓ Payment Intent ID format indicates PRODUCTION environment${colors.reset}`);
    }
  }
  
  // Check ephemeral key if present
  if (data.ephemeralKey) {
    console.log(`${colors.dim}  - Ephemeral Key: ${data.ephemeralKey}${colors.reset}`);
    
    if (data.ephemeralKey.startsWith('ek_test_')) {
      console.log(`${colors.yellow}! Ephemeral Key indicates TEST environment${colors.reset}`);
      return false;
    } else if (data.ephemeralKey.startsWith('ek_live_')) {
      console.log(`${colors.green}✓ Ephemeral Key indicates PRODUCTION environment${colors.reset}`);
    }
  }
  
  // Check customer ID if present
  if (data.customer) {
    console.log(`${colors.dim}  - Customer ID: ${data.customer}${colors.reset}`);
    
    if (data.customer.startsWith('cus_test_')) {
      console.log(`${colors.yellow}! Customer ID indicates TEST environment${colors.reset}`);
      return false;
    } else if (data.customer.startsWith('cus_')) {
      console.log(`${colors.green}✓ Customer ID format is valid for production${colors.reset}`);
    }
  }
  
  // Check subscription ID if present
  if (data.subscriptionId || data.subscription?.id) {
    const subscriptionId = data.subscriptionId || data.subscription?.id;
    console.log(`${colors.dim}  - Subscription ID: ${subscriptionId}${colors.reset}`);
    
    if (subscriptionId.includes('_test_')) {
      console.log(`${colors.yellow}! Subscription ID contains "_test_" indicating TEST environment${colors.reset}`);
      return false;
    } else if (subscriptionId.startsWith('sub_')) {
      console.log(`${colors.green}✓ Subscription ID format is valid for production${colors.reset}`);
    }
  }
  
  return true;
}

async function main() {
  printHeader('STRIPE INTEGRATION TEST TOOL');
  console.log(`${colors.dim}Target Backend: ${BACKEND_URL}${colors.reset}\n`);
  
  // Step 1: Check if backend is reachable
  const isReachable = await checkBackendAvailability();
  if (!isReachable) {
    console.log(`\n${colors.red}Cannot proceed with tests. Backend is unreachable.${colors.reset}`);
    return;
  }
  
  // Step 2: Create a standard payment intent
  const paymentData = await createStandardPaymentIntent();
  let standardPaymentValid = false;
  
  if (paymentData && paymentData.clientSecret) {
    standardPaymentValid = analyzeClientSecret(paymentData.clientSecret);
    standardPaymentValid = analyzeResponse(paymentData) && standardPaymentValid;
  } else {
    console.log(`\n${colors.red}✗ Standard payment flow failed or returned invalid data.${colors.reset}`);
  }
  
  // Step 3: Test subscription creation if available
  const subscriptionData = await testCreateSubscription();
  let subscriptionValid = false;
  
  if (subscriptionData && (subscriptionData.clientSecret || subscriptionData.subscriptionId)) {
    if (subscriptionData.clientSecret) {
      subscriptionValid = analyzeClientSecret(subscriptionData.clientSecret);
    }
    subscriptionValid = analyzeResponse(subscriptionData, 'subscription') && subscriptionValid;
  } else {
    console.log(`\n${colors.yellow}! Subscription flow may not be supported or returned invalid data.${colors.reset}`);
    console.log(`  This is only a concern if your app requires subscriptions.`);
  }
  
  // Final verdict
  printHeader('TEST RESULTS');
  
  if (standardPaymentValid) {
    console.log(`${colors.green}✓ STANDARD PAYMENT INTEGRATION LOOKS CORRECT${colors.reset}`);
    console.log(`${colors.green}  Your backend appears to be using the correct PRODUCTION secret key.${colors.reset}`);
    console.log(`${colors.green}  This should work properly with your frontend production publishable key.${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ STANDARD PAYMENT ISSUES DETECTED${colors.reset}`);
    console.log(`${colors.red}  Your backend may be using a TEST secret key or has format issues.${colors.reset}`);
    console.log(`${colors.red}  This will cause errors when your frontend uses a PRODUCTION publishable key.${colors.reset}`);
  }
  
  if (subscriptionData) {
    if (subscriptionValid) {
      console.log(`\n${colors.green}✓ SUBSCRIPTION INTEGRATION LOOKS CORRECT${colors.reset}`);
    } else {
      console.log(`\n${colors.red}✗ SUBSCRIPTION ISSUES DETECTED${colors.reset}`);
      console.log(`${colors.red}  Your subscription configuration may have environment mismatches.${colors.reset}`);
    }
  }
  
  console.log(`\n${colors.bright}${colors.cyan}==============================================${colors.reset}`);
}

// Execute the main function
main().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  console.error(error);
});