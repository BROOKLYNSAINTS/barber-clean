// stripe-backend-test-fixed.js
// Test the direct Stripe backend connection with correct parameters
require('dotenv').config();
const fetch = require('node-fetch');

async function testBackend() {
  try {
    // Get the backend URL from environment
    const backendUrl = process.env.STRIPE_BACKEND_URL || 'https://barber-backend-ten.vercel.app';
    console.log(`Testing Stripe backend at: ${backendUrl}`);
    
    // Try to create a payment intent with the correct parameters
    const response = await fetch(`${backendUrl}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 1, // $1 for testing
        currency: 'usd',
        description: 'Test payment intent',
        service_name: 'Test Service', // Required parameter
        barber_name: 'Test Barber',   // Required parameter
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    try {
      const data = await response.json();
      console.log('Response body:', JSON.stringify(data, null, 2));
      
      // Check critical fields
      console.log('\nValidating response fields:');
      console.log(`- clientSecret: ${data.clientSecret ? '✓ Present' : '❌ Missing'}`);
      if (data.clientSecret) {
        console.log(`  Format check: ${data.clientSecret.includes('_secret_') ? '✓ Contains "_secret_"' : '❌ Invalid format'}`);
      }
      console.log(`- ephemeralKey: ${data.ephemeralKey ? '✓ Present' : '❌ Missing'}`);
      console.log(`- customer: ${data.customer ? '✓ Present' : '❌ Missing'}`);
      console.log(`- paymentIntentId: ${data.paymentIntentId ? '✓ Present' : '❌ Missing'}`);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      const text = await response.text();
      console.log('Raw response:', text.substring(0, 500));
    }
  } catch (error) {
    console.error('Error making request:', error);
  }
}

testBackend();