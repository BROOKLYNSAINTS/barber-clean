/**
 * Stripe Payment Testing Tool
 * Run this script to simulate payment flows and verify your Stripe integration
 */

require('dotenv').config();
const fetch = require('node-fetch');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test configuration - modify these values as needed
const config = {
  backendUrl: process.env.STRIPE_BACKEND_URL || "https://barber-backend-ten.vercel.app",
  testUserId: `test-${Date.now()}`,
  testAmount: 30,
  testCurrency: 'usd',
};

// Helper function to ask questions
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Main function
async function testStripePayment() {
  console.log("🔍 STRIPE PAYMENT TESTING TOOL");
  console.log("==============================");
  console.log(`Using backend URL: ${config.backendUrl}`);
  
  try {
    // 1. Check backend health
    console.log("\n1️⃣ Checking backend health...");
    const healthResponse = await fetch(`${config.backendUrl}/health`);
    if (!healthResponse.ok) {
      throw new Error(`Backend health check failed with status ${healthResponse.status}`);
    }
    console.log("✅ Backend is healthy!");
    
    // 2. Test create-payment-intent endpoint
    console.log("\n2️⃣ Testing payment intent creation...");
    
    // Ask for parameters
    const serviceName = await ask("Enter service name [Monthly Barber Subscription]: ") || "Monthly Barber Subscription";
    const barberName = await ask("Enter barber name [Test Barber]: ") || "Test Barber";
    
    console.log(`\nSending request to ${config.backendUrl}/api/create-payment-intent with:`);
    console.log(`- Service: ${serviceName}`);
    console.log(`- Barber: ${barberName}`);
    console.log(`- Amount: $${config.testAmount}`);
    
    const paymentIntentResponse = await fetch(`${config.backendUrl}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: config.testAmount,
        currency: config.testCurrency,
        description: serviceName,
        service_name: serviceName,
        barber_name: barberName,
        metadata: {
          userId: config.testUserId,
          type: 'subscription',
          testMode: true
        }
      })
    });
    
    // Handle response
    if (!paymentIntentResponse.ok) {
      const errorText = await paymentIntentResponse.text();
      throw new Error(`Payment intent creation failed: ${errorText}`);
    }
    
    const paymentData = await paymentIntentResponse.json();
    
    console.log("\n✅ Payment intent created successfully!");
    console.log("\nAPI Response contains:");
    console.log(`- Client Secret: ${paymentData.clientSecret ? "Present ✅" : "Missing ❌"}`);
    console.log(`- Ephemeral Key: ${paymentData.ephemeralKey ? "Present ✅" : "Missing ❌"}`);
    console.log(`- Customer ID: ${paymentData.customer ? "Present ✅" : "Missing ❌"}`);
    console.log(`- Payment Intent ID: ${paymentData.paymentIntentId ? paymentData.paymentIntentId : "Missing ❌"}`);
    
    // Validate required fields
    if (!paymentData.clientSecret || !paymentData.ephemeralKey || !paymentData.customer) {
      console.error("\n⚠️ Some required fields are missing from the API response!");
      console.error("This will cause payment sheet initialization to fail.");
    }
    
    // 3. Explain next steps
    console.log("\n3️⃣ Next steps:");
    console.log("In your app, you would now initialize the payment sheet with:");
    console.log(`
    const paymentSheetParams = {
        merchantDisplayName: "ScheduleSync AI LLC",
        customerId: "${paymentData.customer || '[MISSING CUSTOMER ID]'}",
        customerEphemeralKeySecret: "${paymentData.ephemeralKey ? '[VALID EPHEMERAL KEY]' : '[MISSING EPHEMERAL KEY]'}",
        paymentIntentClientSecret: "${paymentData.clientSecret ? '[VALID CLIENT SECRET]' : '[MISSING CLIENT SECRET]'}",
        returnURL: "barberapp://payment-return"
    };
    
    // Initialize payment sheet
    const { error } = await initPaymentSheet(paymentSheetParams);
    
    // Present payment sheet if no errors
    if (!error) {
        const { error: presentError } = await presentPaymentSheet();
        // Handle result
    }
    `);
    
    // 4. Test card information
    console.log("\n4️⃣ Test card information:");
    console.log("For testing in development/test mode, use these cards:");
    console.log("- Success: 4242 4242 4242 4242 (Any future date, any CVC)");
    console.log("- Decline (Generic): 4000 0000 0000 0002");
    console.log("- Decline (Insufficient Funds): 4000 0000 0000 9995");
    console.log("- Decline (Expired Card): 4000 0000 0000 0069");
    console.log("- 3D Secure Required: 4000 0025 0000 3155");

    console.log("\n✅ TEST COMPLETED SUCCESSFULLY");
    
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("Check your backend URL and network connectivity.");
  } finally {
    rl.close();
  }
}

// Run the test
testStripePayment();