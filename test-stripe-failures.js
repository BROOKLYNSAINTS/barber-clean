/**
 * Stripe Payment Error Test Script
 * 
 * This script specifically tests Stripe payment error handling by generating 
 * predictable errors using test card numbers.
 * 
 * Usage:
 * node test-stripe-failures.js
 */

// Import required modules
const fetch = require('node-fetch');
const readline = require('readline');

// Create readline interface for interactive prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test cards that trigger specific errors
// Source: https://stripe.com/docs/testing
const TEST_CARDS = {
  success: {
    number: '4242424242424242',
    description: 'Successful payment'
  },
  declinedGeneric: {
    number: '4000000000000002',
    description: 'Generic decline'
  },
  declinedInsufficientFunds: {
    number: '4000000000009995',
    description: 'Declined (insufficient funds)'
  },
  declinedLostCard: {
    number: '4000000000009987',
    description: 'Declined (lost card)'
  },
  declinedStolenCard: {
    number: '4000000000009979',
    description: 'Declined (stolen card)'
  },
  declinedExpiredCard: {
    number: '4000000000000069',
    description: 'Declined (expired card)'
  },
  declinedProcessingError: {
    number: '4000000000000119',
    description: 'Declined (processing error)'
  },
  declinedIncorrectCVC: {
    number: '4000000000000127',
    description: 'Declined (incorrect CVC)'
  },
  authenticationRequired: {
    number: '4000002500003155',
    description: '3D Secure authentication required'
  }
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Print a formatted message with color
 */
function print(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Print a header section
 */
function printHeader(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log('='.repeat(60));
}

/**
 * Ask a question and get user input
 */
function ask(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question}${colors.reset} `, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Print a table of test cards
 */
function printTestCardTable() {
  printHeader('AVAILABLE TEST CARDS');
  
  print('ID'.padEnd(25) + 'CARD NUMBER'.padEnd(20) + 'DESCRIPTION', colors.yellow);
  print('='.repeat(60));
  
  for (const [id, card] of Object.entries(TEST_CARDS)) {
    print(
      `${id.padEnd(25)}${card.number.padEnd(20)}${card.description}`
    );
  }
}

/**
 * Create a payment method token using the Stripe API
 * In a real app, this would be handled by Stripe.js or the Stripe SDK
 */
async function createStripePaymentMethodToken(cardId) {
  const card = TEST_CARDS[cardId];
  if (!card) {
    throw new Error(`Unknown test card: ${cardId}`);
  }
  
  print(`\nSimulating payment with ${card.description} card: ${card.number}`, colors.blue);
  print('In a real app, this would be handled by the Stripe SDK in the mobile app.', colors.blue);
  print('For this test, we\'re simulating the payment flow.', colors.blue);
  
  return {
    id: `pm_test_${Date.now()}`,
    card: {
      brand: 'visa',
      last4: card.number.slice(-4),
      exp_month: 12,
      exp_year: 2030
    },
    testCardUsed: cardId
  };
}

/**
 * Test the payment flow with a specific test card
 */
async function testPaymentWithCard(cardId, backendUrl) {
  try {
    // Step 1: Get a payment method token (simulated)
    const paymentMethod = await createStripePaymentMethodToken(cardId);
    
    // Step 2: Create a payment intent on the backend
    print('\nCreating payment intent...', colors.blue);
    const paymentIntentResponse = await fetch(`${backendUrl}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 30,
        currency: 'usd',
        description: 'Test Payment',
        service_name: 'Error Test',
        barber_name: 'Test Barber',
        metadata: {
          userId: `test-user-${Date.now()}`,
          testCardUsed: cardId
        }
      })
    });
    
    if (!paymentIntentResponse.ok) {
      throw new Error(`Failed to create payment intent: ${paymentIntentResponse.status}`);
    }
    
    const paymentIntent = await paymentIntentResponse.json();
    print('Payment intent created successfully', colors.green);
    
    // Step 3: Simulate confirming the payment
    print('\nSimulating payment confirmation...', colors.blue);
    print('In a real app, this would be handled by presentPaymentSheet()', colors.blue);
    
    // Check the test card used to predict the outcome
    const card = TEST_CARDS[cardId];
    const isErrorCard = cardId !== 'success';
    
    // Print the expected outcome
    if (isErrorCard) {
      print(`\nExpected outcome: ${colors.red}PAYMENT FAILED${colors.reset}`, colors.yellow);
      print(`Error type: ${card.description}`, colors.yellow);
      
      // Print handling recommendation
      print('\nRecommended error handling:', colors.magenta);
      
      if (cardId === 'declinedInsufficientFunds') {
        print('- Show message: "Your card has insufficient funds. Please try a different card."');
        print('- Provide option to try a different payment method');
      } else if (cardId === 'declinedLostCard' || cardId === 'declinedStolenCard') {
        print('- Show message: "This card has been reported lost/stolen and cannot be used."');
        print('- Do not retry with the same card');
      } else if (cardId === 'declinedExpiredCard') {
        print('- Show message: "Your card has expired. Please use a different card."');
        print('- Prompt for a new card');
      } else if (cardId === 'declinedProcessingError') {
        print('- Show message: "There was an error processing your card. Please try again."');
        print('- Allow retry (this is often a temporary issue)');
      } else if (cardId === 'declinedIncorrectCVC') {
        print('- Show message: "The security code (CVC) you entered is incorrect."');
        print('- Allow user to re-enter CVC');
      } else {
        print('- Show generic message: "Your card was declined. Please try a different payment method."');
        print('- Prompt for a different payment method');
      }
      
      // Print the code from subscription-payment.js that handles this
      print('\nRelevant code from subscription-payment.js:', colors.cyan);
      
      if (cardId === 'declinedInsufficientFunds') {
        print(`
if (presentError.code === "Failed") {
  errorTitle = "Payment Failed";
  
  if (presentError.stripeErrorCode === "card_declined") {
    if (presentError.declineCode === "insufficient_funds") {
      errorMessage = "Your card has insufficient funds. Please try a different card.";
    } else {
      errorMessage = "Your card was declined. Please try a different payment method.";
    }
  }
}`, colors.white);
      } else if (cardId === 'declinedLostCard' || cardId === 'declinedStolenCard') {
        print(`
if (presentError.code === "Failed") {
  errorTitle = "Payment Failed";
  
  if (presentError.stripeErrorCode === "card_declined") {
    if (presentError.declineCode === "lost_card" || presentError.declineCode === "stolen_card") {
      errorMessage = "This card has been reported lost or stolen and cannot be used.";
    } else {
      errorMessage = "Your card was declined. Please try a different payment method.";
    }
  }
}`, colors.white);
      }
      
    } else {
      print(`\nExpected outcome: ${colors.green}PAYMENT SUCCESSFUL${colors.reset}`, colors.yellow);
    }
    
    print('\nPayment simulation complete!', colors.green);
    
  } catch (error) {
    print(`Error: ${error.message}`, colors.red);
  }
}

/**
 * Main function to run the test script
 */
async function runTests() {
  printHeader('STRIPE PAYMENT ERROR TEST UTILITY');
  print('This script helps test error handling for different payment failure scenarios', colors.cyan);
  
  // Get backend URL
  const backendUrl = await ask('Backend URL [https://barber-backend-ten.vercel.app]: ') || 'https://barber-backend-ten.vercel.app';
  
  // Show available test cards
  printTestCardTable();
  
  // Main test loop
  while (true) {
    print('\n');
    const cardId = await ask('Enter test card ID (or "exit" to quit): ');
    
    if (cardId.toLowerCase() === 'exit' || cardId.toLowerCase() === 'quit') {
      break;
    }
    
    if (!TEST_CARDS[cardId]) {
      print(`Unknown card ID: ${cardId}. Please choose from the table above.`, colors.red);
      continue;
    }
    
    await testPaymentWithCard(cardId, backendUrl);
    
    print('\nWould you like to test another card?', colors.yellow);
  }
}

// Run the tests
runTests()
  .then(() => {
    print('\nThanks for using the Stripe Error Test Utility!', colors.green);
    rl.close();
  })
  .catch(error => {
    print(`Unhandled error: ${error.message}`, colors.red);
    rl.close();
  });

// Handle exit
rl.on('close', () => {
  process.exit(0);
});