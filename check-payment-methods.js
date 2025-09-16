/**
 * Backend payment method availability checker
 * This file can be run directly with Node.js to check if payment methods are available
 * for specific countries without relying on the Stripe payment sheet UI
 */
require('dotenv').config();
const fetch = require('node-fetch');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Stripe backend URL from .env file
const STRIPE_BACKEND_URL = process.env.STRIPE_BACKEND_URL || 'https://barber-backend-ten.vercel.app';

// Test customer information
const TEST_CUSTOMER_INFO = {
  name: "Test Customer",
  email: "test@example.com"
};

/**
 * Get available payment methods for a specific country
 * @param {string} countryCode - ISO country code (e.g., 'US', 'CA', 'GB')
 */
async function checkPaymentMethodAvailability(countryCode) {
  try {
    console.log(`\nChecking payment methods available in ${countryCode}...\n`);
    
    // First, check backend health
    console.log('1. Checking backend health...');
    const healthCheck = await fetch(`${STRIPE_BACKEND_URL}/health`);
    
    if (!healthCheck.ok) {
      console.error('❌ Backend health check failed!');
      console.error(`Status: ${healthCheck.status} ${healthCheck.statusText}`);
      return;
    }
    
    console.log('✓ Backend health check passed!');
    
    // Now check payment method availability
    console.log('\n2. Checking payment method availability...');
    const response = await fetch(`${STRIPE_BACKEND_URL}/api/payment-methods/availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        country: countryCode,
        currency: 'usd', // You can customize this based on the country
        amount: 3000, // $30.00
        customer: TEST_CUSTOMER_INFO
      })
    });
    
    if (!response.ok) {
      console.error('❌ Payment method availability check failed!');
      console.error(`Status: ${response.status} ${response.statusText}`);
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Could not parse error response');
      }
      return;
    }
    
    const data = await response.json();
    
    console.log(`\n=== Payment Methods Available in ${countryCode} ===\n`);
    
    if (!data.paymentMethods || data.paymentMethods.length === 0) {
      console.log('❌ No payment methods are available for this country.');
      return;
    }
    
    // Log available payment methods
    data.paymentMethods.forEach((method, index) => {
      console.log(`${index + 1}. ${method.type.toUpperCase()}`);
      
      // If there are additional details about the payment method
      if (method.details) {
        Object.entries(method.details).forEach(([key, value]) => {
          console.log(`   - ${key}: ${value}`);
        });
      }
    });
    
    console.log('\n=== Recommendation ===\n');
    if (data.paymentMethods.some(m => m.type === 'card')) {
      console.log('✓ Credit card payments are available - users should be able to pay with cards');
    } else {
      console.log('⚠️ Credit card payments are NOT available in this country');
      console.log('   Consider enabling alternative payment methods or using direct card input');
    }
    
  } catch (error) {
    console.error('Error checking payment method availability:', error);
  }
}

// Interactive mode
function promptForCountry() {
  rl.question('\nEnter a country code to check (e.g., US, GB, IN) or "exit" to quit: ', (answer) => {
    if (answer.toLowerCase() === 'exit') {
      rl.close();
      return;
    }
    
    const countryCode = answer.trim().toUpperCase();
    if (countryCode.length !== 2) {
      console.log('Please enter a valid 2-letter country code');
      promptForCountry();
      return;
    }
    
    checkPaymentMethodAvailability(countryCode)
      .then(() => {
        promptForCountry();
      })
      .catch(error => {
        console.error('Error:', error);
        promptForCountry();
      });
  });
}

// Check if running directly from command line
if (require.main === module) {
  console.log('=================================================');
  console.log('=== Stripe Payment Method Availability Check ===');
  console.log('=================================================');
  console.log('\nThis tool checks which payment methods are available in different countries.');
  
  // If country code was provided as command line argument
  if (process.argv[2]) {
    const countryCode = process.argv[2].trim().toUpperCase();
    checkPaymentMethodAvailability(countryCode)
      .finally(() => {
        rl.close();
      });
  } else {
    promptForCountry();
  }
}

module.exports = { checkPaymentMethodAvailability };