/**
 * Debug script to check payment initialization issues
 * Run this with: node debug-payment-sheet.js
 */

const fetch = require('node-fetch');

async function debugPaymentSheet() {
  console.log("🔍 DEBUGGING PAYMENT SHEET INITIALIZATION ISSUES");
  console.log("-------------------------------------------------");
  
  try {
    // 1. Get data from backend
    console.log("\n1️⃣ FETCHING DATA FROM BACKEND:");
    
    const backendUrl = "https://barber-backend-ten.vercel.app";
    const userId = `test-debug-${Date.now()}`;
    
    console.log(`Backend URL: ${backendUrl}`);
    console.log(`Test User ID: ${userId}`);
    
    const response = await fetch(`${backendUrl}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 30,
        currency: 'usd',
        description: "Monthly Barber Subscription",
        service_name: "Monthly Barber Subscription", // REQUIRED
        barber_name: "Debug User", // REQUIRED
        metadata: {
          userId: userId,
          type: 'subscription',
        }
      })
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorText = await response.text();
      console.error("❌ Error response:", errorText);
      return;
    }
    
    // 2. Parse and validate response data
    console.log("\n2️⃣ VALIDATING RESPONSE DATA:");
    
    const data = await response.json();
    
    // Check all properties that come from the backend
    const responseKeys = Object.keys(data);
    console.log(`Response contains these fields: ${responseKeys.join(', ')}`);
    
    // Print data field types to verify the structure
    console.log("\nField type verification:");
    for (const [key, value] of Object.entries(data)) {
      console.log(`- ${key}: ${typeof value} ${value ? (typeof value === 'string' ? `(starts with: ${value.substring(0, 10)}...)` : '') : '(null/undefined)'}`);
    }
    
    // 3. Test how we extract data
    console.log("\n3️⃣ TESTING DATA EXTRACTION:");
    
    // Simulating how we extract data in our app
    const { clientSecret, ephemeralKey, customer, paymentIntentId } = data;
    
    // Verify what we get when destructuring
    console.log("\nDestructured fields:");
    console.log(`- clientSecret: ${typeof clientSecret} ${clientSecret ? `(starts with: ${clientSecret.substring(0, 10)}...)` : '(null/undefined)'}`);
    console.log(`- ephemeralKey: ${typeof ephemeralKey} ${ephemeralKey ? `(present)` : '(null/undefined)'}`);
    console.log(`- customer: ${typeof customer} ${customer ? `(${customer})` : '(null/undefined)'}`);
    console.log(`- paymentIntentId: ${typeof paymentIntentId} ${paymentIntentId ? `(${paymentIntentId})` : '(null/undefined)'}`);
    
    // 4. Test initPaymentSheet object creation
    console.log("\n4️⃣ TESTING PAYMENT SHEET PARAMS:");
    
    // Create the object that would be passed to initPaymentSheet
    const initPaymentSheetParams = {
      merchantDisplayName: "Barber App, Inc.",
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: clientSecret,
      allowsDelayedPaymentMethods: false,
      returnURL: "barberapp://payment-return"
    };
    
    // Check if all required fields are present and have the right type
    const requiredParams = [
      'merchantDisplayName', 
      'customerId', 
      'customerEphemeralKeySecret', 
      'paymentIntentClientSecret'
    ];
    
    const missingParams = requiredParams.filter(param => !initPaymentSheetParams[param]);
    
    if (missingParams.length === 0) {
      console.log("✅ All required parameters are present for initPaymentSheet");
      console.log("\nPayment Sheet Initialization object:");
      for (const [key, value] of Object.entries(initPaymentSheetParams)) {
        console.log(`- ${key}: ${typeof value} ${value ? (typeof value === 'string' && value.length > 20 ? `(${value.substring(0, 10)}...)` : `(${value})`) : '(null/undefined)'}`);
      }
    } else {
      console.error(`❌ Missing required parameters: ${missingParams.join(', ')}`);
    }
    
    console.log("\n✅ DEBUGGING COMPLETE");
    console.log("If all checks passed, the issue may be in Stripe SDK initialization or device compatibility.");
    
  } catch (error) {
    console.error("❌ ERROR DURING DEBUGGING:", error);
  }
}

debugPaymentSheet();