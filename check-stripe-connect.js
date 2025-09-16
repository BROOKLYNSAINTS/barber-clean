/**
 * Stripe Connect Diagnostics Tool
 * 
 * This script verifies your Stripe Connect platform configuration and helps
 * diagnose issues with the barber onboarding flow.
 */
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function checkStripeConnectConfig() {
  console.log('=================================================');
  console.log('======== Stripe Connect Diagnostics Tool ========');
  console.log('=================================================\n');

  try {
    // Step 1: Verify we can connect to Stripe
    console.log('1. Verifying Stripe API connection...');
    const account = await stripe.account.retrieve();
    console.log(`✓ Connected to platform account: ${account.id}`);
    console.log(`✓ Account type: ${account.type}`);
    
    if (account.type !== 'standard' && account.type !== 'express' && account.type !== 'custom') {
      console.log('❌ This is NOT a Stripe Connect platform account');
      console.log('   You need to register as a platform at: https://dashboard.stripe.com/account/applications/settings');
      return;
    }
    
    // Step 2: Check Connect platform settings
    console.log('\n2. Checking Connect platform configuration...');
    
    // Check account capabilities for Connect
    const capabilities = await stripe.account.retrieve({
      expand: ['capabilities']
    });
    
    if (!capabilities.capabilities) {
      console.log('❌ No capabilities found - this account may not be set up for Connect');
    } else {
      console.log('Platform capabilities:');
      Object.entries(capabilities.capabilities).forEach(([key, value]) => {
        const status = value.status === 'active' ? '✓' : '❌';
        console.log(`  ${status} ${key}: ${value.status}`);
      });
      
      // Check critical Connect capabilities
      if (capabilities.capabilities.transfers && capabilities.capabilities.transfers.status !== 'active') {
        console.log('❌ CRITICAL: Transfers capability is not active');
        console.log('   Barbers will not be able to receive payouts without this');
      }
    }
    
    // Step 3: Check Connect settings
    console.log('\n3. Checking Connect settings...');
    try {
      const settings = await stripe.accountLinks.create({
        account: 'acct_temporary', // This will fail but let us know if the endpoint is accessible
        refresh_url: 'https://example.com/reauth',
        return_url: 'https://example.com/return',
        type: 'account_onboarding',
      });
    } catch (error) {
      if (error.code === 'resource_missing' && error.param === 'account') {
        console.log('✓ Connect AccountLinks API is accessible (expected error on test account)');
      } else if (error.code === 'parameter_invalid') {
        console.log('✓ Connect AccountLinks API is accessible');
      } else {
        console.log('❌ Error accessing Connect AccountLinks API:', error.message);
      }
    }
    
    // Step 4: Check for recent Connected accounts
    console.log('\n4. Checking for recently created Connected accounts...');
    try {
      const connectedAccounts = await stripe.accounts.list({
        limit: 5,
      });
      
      if (connectedAccounts.data.length === 0) {
        console.log('⚠️ No connected accounts found');
        console.log('   This is expected if no barbers have signed up yet');
      } else {
        console.log(`✓ Found ${connectedAccounts.data.length} connected accounts`);
        console.log('Recent accounts:');
        
        // Display connected accounts and their verification status
        for (const connAcc of connectedAccounts.data) {
          const createdDate = new Date(connAcc.created * 1000).toLocaleDateString();
          const status = connAcc.details_submitted ? 
            (connAcc.payouts_enabled ? '✓ Verified' : '⚠️ Pending verification') : 
            '❌ Incomplete';
          
          console.log(`  - ${connAcc.id} (${createdDate}): ${status}`);
          
          // Check if this account has requirements
          if (connAcc.requirements && connAcc.requirements.currently_due && connAcc.requirements.currently_due.length > 0) {
            console.log('    Requirements needed:');
            connAcc.requirements.currently_due.forEach(req => {
              console.log(`    • ${req}`);
            });
          }
        }
      }
    } catch (error) {
      console.log('❌ Error listing connected accounts:', error.message);
    }
    
    console.log('\n=================================================');
    console.log('============== RECOMMENDATIONS =================');
    console.log('=================================================');
    
    console.log('1. Ensure your Stripe Connect onboarding flow is properly set up:');
    console.log('   • In your Stripe Dashboard, go to Connect > Settings');
    console.log('   • Verify that your platform is configured correctly');
    console.log('   • Check that your platform\'s branding is complete');
    
    console.log('\n2. For barber onboarding issues:');
    console.log('   • Ensure you\'re creating Connect accounts correctly in your code');
    console.log('   • Make sure you\'re redirecting to the proper onboarding URL');
    console.log('   • Check that you\'re handling both success and failure cases');
    
    console.log('\n3. Improve your barber onboarding experience:');
    console.log('   • Explain to barbers that they MUST complete Stripe verification');
    console.log('   • Add clear instructions about what documents they\'ll need');
    console.log('   • Implement a way to remind barbers who abandon the verification');
    
    // Provide specific code example for Connect
    console.log('\n4. Example code to create a Connect account and start onboarding:');
    console.log(`
    // 1. First create a Connected account for the barber
    const account = await stripe.accounts.create({
      type: 'express', // or 'standard' depending on your setup
      email: barber.email,
      metadata: { 
        barberId: barber.id 
      }
    });
    
    // 2. Store the account ID in your database
    await updateBarber(barber.id, { stripeConnectAccountId: account.id });
    
    // 3. Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://yourapp.com/connect/reauth',
      return_url: 'https://yourapp.com/connect/return',
      type: 'account_onboarding',
    });
    
    // 4. Redirect the barber to the accountLink.url to complete onboarding
    // This is where they'll see the Stripe verification screen
    `);
    
  } catch (error) {
    console.error('Error checking Stripe Connect configuration:', error);
  }
}

// Run the check if executed directly
if (require.main === module) {
  checkStripeConnectConfig();
}

module.exports = { checkStripeConnectConfig };