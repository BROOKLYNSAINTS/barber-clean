const fetch = require('node-fetch');

async function testStripeIntegration() {
  try {
    console.log("🔍 Testing Stripe integration with fixed parameters");
    
    // Using the main backend URL
    const backendUrl = "https://barber-backend-ten.vercel.app";
    console.log(`- Backend URL: ${backendUrl}`);
    
    // Test user ID for this request
    const userId = `test-user-${Date.now()}`;
    console.log(`- Test User ID: ${userId}`);
    
    console.log("\nSending request to create payment intent...");
    const response = await fetch(`${backendUrl}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 30, // $30 for subscription
        currency: 'usd',
        description: "Monthly Barber Subscription",
        service_name: "Monthly Barber Subscription", // REQUIRED by the backend
        barber_name: "Barber User", // REQUIRED by the backend
        metadata: {
          userId: userId,
          type: 'subscription',
          priceId: "price_1NWfGP4MureyHjXxYMdeBCtX" // Example subscription price ID
        }
      })
    });
    
    console.log(`\n✅ Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error("❌ Error response:", errorData);
      } catch (e) {
        console.error(`❌ HTTP Error: ${response.status}`);
      }
      return;
    }
    
    const data = await response.json();
    
    console.log("\n🔑 Payment Intent Data:");
    console.log(`- Client Secret: ${data.clientSecret ? data.clientSecret.substring(0, 10) + '...' : 'MISSING'}`);
    console.log(`- Ephemeral Key: ${data.ephemeralKey ? 'PRESENT' : 'MISSING'}`);
    console.log(`- Customer ID: ${data.customer ? data.customer : 'MISSING'}`);
    console.log(`- Payment Intent ID: ${data.paymentIntentId ? data.paymentIntentId : 'MISSING'}`);
    
    // Verify all required fields are present
    const requiredFields = ['clientSecret', 'ephemeralKey', 'customer'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      console.error(`\n❌ Missing required fields: ${missingFields.join(', ')}`);
    } else {
      console.log("\n✅ All required fields are present");
      
      // Show the structure needed for initPaymentSheet
      console.log("\n📋 Payment Sheet Initialization Parameters:");
      console.log(`
  await initPaymentSheet({
    merchantDisplayName: "Barber App, Inc.",
    customerId: "${data.customer}",
    customerEphemeralKeySecret: "${data.ephemeralKey ? '[VALID EPHEMERAL KEY]' : 'MISSING'}",
    paymentIntentClientSecret: "${data.clientSecret ? '[VALID CLIENT SECRET]' : 'MISSING'}",
    // Additional parameters...
  });
      `);
    }
    
  } catch (error) {
    console.error("❌ Error testing Stripe integration:", error);
  }
}

testStripeIntegration();