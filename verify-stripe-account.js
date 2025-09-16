/**
 * Stripe Account Verification Checker
 * 
 * This script verifies if your Stripe account is properly set up for live payments.
 * It checks for common issues that prevent payment methods from showing up in production.
 */
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkStripeAccountStatus() {
  console.log('=================================================');
  console.log('=== Stripe Account Verification Checker ========');
  console.log('=================================================\n');

  try {
    // Step 1: Verify we can connect to Stripe
    console.log('1. Verifying Stripe API connection...');
    const account = await stripe.account.retrieve();
    console.log(`✓ Connected to Stripe as: ${account.business_profile?.name || account.email || 'Unknown'}`);
    console.log(`✓ Account ID: ${account.id}`);
    
    // Step 2: Check if account is in test mode
    console.log('\n2. Checking account mode...');
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      console.log('⚠️ Using TEST mode API keys');
      console.log('   In test mode, all payment methods are available without verification');
      console.log('   For production, you need to switch to LIVE keys and complete account verification');
    } else if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      console.log('✓ Using LIVE mode API keys');
    } else {
      console.log('❌ Could not determine if using test or live keys');
    }

    // Step 3: Check account verification status
    console.log('\n3. Checking account verification status...');
    
    // Check if account details are submitted and pending verification
    if (account.details_submitted) {
      console.log('✓ Account details have been submitted');
    } else {
      console.log('❌ CRITICAL: Account details have not been fully submitted');
      console.log('   You must complete the account onboarding in Stripe Dashboard:');
      console.log('   https://dashboard.stripe.com/account/onboarding');
    }
    
    // Check for capabilities (needed for payment processing)
    console.log('\n4. Checking payment capabilities...');
    const capabilities = await stripe.account.listCapabilities();
    
    const cardPayments = capabilities.data.find(c => c.id === 'card_payments');
    const transfers = capabilities.data.find(c => c.id === 'transfers');
    
    if (cardPayments) {
      if (cardPayments.status === 'active') {
        console.log('✓ Card payments capability is ACTIVE');
      } else {
        console.log(`❌ Card payments capability is ${cardPayments.status.toUpperCase()}`);
        console.log('   This prevents card payments from appearing in the Payment Sheet');
      }
    } else {
      console.log('❌ Card payments capability not found');
    }
    
    if (transfers) {
      if (transfers.status === 'active') {
        console.log('✓ Transfers capability is ACTIVE');
      } else {
        console.log(`❌ Transfers capability is ${transfers.status.toUpperCase()}`);
      }
    }
    
    // Step 5: Check payment method configuration
    console.log('\n5. Checking payment method configuration...');
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        limit: 5,
      });
      
      console.log(`✓ Payment methods API accessible (found ${paymentMethods.data.length} payment methods)`);
      
      // Check payment method settings
      const settings = await stripe.accountSettings.retrieve();
      
      if (settings.card_payments && settings.card_payments.statement_descriptor_prefix) {
        console.log('✓ Statement descriptor is set up');
      } else {
        console.log('⚠️ Statement descriptor is not set up - this may cause issues with some payment methods');
      }
    } catch (error) {
      console.log('❌ Error checking payment methods:', error.message);
    }
    
    console.log('\n=================================================');
    console.log('============== RECOMMENDATIONS =================');
    console.log('=================================================');
    
    if (!account.details_submitted) {
      console.log('1. CRITICAL: Complete Stripe account onboarding');
      console.log('   • Go to https://dashboard.stripe.com/account/onboarding');
      console.log('   • Complete ALL required information including:');
      console.log('     - Business information');
      console.log('     - Owner/representative details');
      console.log('     - Banking information');
      console.log('     - Tax documents');
    }
    
    if (cardPayments && cardPayments.status !== 'active') {
      console.log('2. Activate card payments capability');
      console.log('   • Provide any additional verification documents requested by Stripe');
      console.log('   • Wait for Stripe to verify your information (can take 24-48 hours)');
    }
    
    console.log('\nFor all account verification issues:');
    console.log('• Log into your Stripe dashboard (https://dashboard.stripe.com)');
    console.log('• Look for any red warning banners at the top');
    console.log('• Complete any pending requirements listed');
    console.log('• Check for any emails from Stripe requesting additional information');
    
  } catch (error) {
    console.error('Error checking Stripe account status:', error);
    
    if (error.code === 'invalid_request_error' && error.message.includes('Invalid API Key')) {
      console.error('\n❌ Invalid API Key - please check your STRIPE_SECRET_KEY environment variable');
    }
  }
}

// Run the check if executed directly
if (require.main === module) {
  checkStripeAccountStatus();
}

module.exports = { checkStripeAccountStatus };