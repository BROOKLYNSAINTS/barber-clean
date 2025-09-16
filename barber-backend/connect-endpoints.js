/**
 * connect-endpoints.js
 * 
 * Backend endpoints for Stripe Connect integration with subscriptions
 * Add these to your Express.js backend (barber-backend)
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * @route POST /api/create-subscription-payment
 * @description Create a payment intent for subscription with Connect onboarding
 * @access Private - requires authentication
 */
exports.createSubscriptionPayment = async (req, res) => {
  try {
    const { userId, email, name, price } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing required parameters: userId, email' });
    }
    
    console.log(`Creating subscription payment for user ${userId} (${email})`);
    
    // Check if customer exists in Stripe
    let customer;
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });
    
    if (customers.data.length > 0) {
      customer = customers.data[0];
      console.log(`Using existing customer: ${customer.id}`);
    } else {
      // Create a new customer in Stripe
      customer = await stripe.customers.create({
        email: email,
        name: name || email,
        metadata: {
          userId: userId
        }
      });
      console.log(`Created new customer: ${customer.id}`);
    }
    
    // Create a payment intent for the subscription
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 3000, // $30.00
      currency: 'usd',
      customer: customer.id,
      setup_future_usage: 'off_session', // Allow using this payment method for future charges
      description: "Barber Monthly Subscription",
      metadata: {
        userId: userId,
        type: 'subscription',
        flow: 'connect' // Indicates this is part of Connect onboarding
      }
    });
    
    console.log(`Created payment intent: ${paymentIntent.id}`);
    
    // Create an ephemeral key for the customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2020-08-27' } // Use a supported API version
    );
    
    console.log(`Created ephemeral key: ${ephemeralKey.id}`);
    
    // Return everything needed for the payment sheet
    res.json({
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      paymentIntentId: paymentIntent.id,
      publishableKey: process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_LIVE_PUBLISHABLE_KEY 
        : process.env.STRIPE_TEST_PUBLISHABLE_KEY
    });
    
  } catch (error) {
    console.error('Error creating subscription payment:', error);
    res.status(500).json({
      error: 'Failed to create subscription payment',
      details: error.message
    });
  }
};

/**
 * @route POST /api/connect/create-account
 * @description Create a Stripe Connect account for a barber
 * @access Private - requires authentication
 */
exports.createConnectAccount = async (req, res) => {
  try {
    const { userId, email, name } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing required parameters: userId, email' });
    }
    
    console.log(`Creating Connect account for barber ${userId} (${email})`);
    
    // Check if barber already has a Connect account
    const barberDoc = await db.collection('barbers').doc(userId).get();
    
    if (barberDoc.exists && barberDoc.data().stripeConnectAccountId) {
      const existingAccountId = barberDoc.data().stripeConnectAccountId;
      console.log(`Barber already has Connect account: ${existingAccountId}`);
      
      // Create a new account link for the existing account
      const accountLink = await stripe.accountLinks.create({
        account: existingAccountId,
        refresh_url: `${process.env.FRONTEND_URL || 'https://yourapp.com'}/connect-refresh`,
        return_url: `${process.env.FRONTEND_URL || 'https://yourapp.com'}/connect-return`,
        type: 'account_onboarding',
      });
      
      return res.json({ 
        accountLinkUrl: accountLink.url,
        isNewAccount: false
      });
    }
    
    // Create a new Express Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      email: email,
      business_type: 'individual',
      business_profile: {
        name: name || email,
        product_description: 'Barber services',
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      metadata: {
        userId: userId
      }
    });
    
    console.log(`Created Connect account: ${account.id}`);
    
    // Update the barber's profile with the Connect account ID
    await db.collection('barbers').doc(userId).update({
      stripeConnectAccountId: account.id,
      stripeConnectStatus: 'created',
      stripeConnectCreatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL || 'https://yourapp.com'}/connect-refresh`,
      return_url: `${process.env.FRONTEND_URL || 'https://yourapp.com'}/connect-return`,
      type: 'account_onboarding',
    });
    
    console.log(`Created account link: ${accountLink.url.substring(0, 30)}...`);
    
    res.json({
      accountLinkUrl: accountLink.url,
      accountId: account.id,
      isNewAccount: true
    });
    
  } catch (error) {
    console.error('Error creating Connect account:', error);
    res.status(500).json({
      error: 'Failed to create Connect account',
      details: error.message
    });
  }
};

/**
 * @route POST /api/connect/resume-onboarding
 * @description Resume onboarding for an existing Connect account
 * @access Private - requires authentication
 */
exports.resumeConnectOnboarding = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }
    
    // Get the barber's Connect account ID
    const barberDoc = await db.collection('barbers').doc(userId).get();
    
    if (!barberDoc.exists || !barberDoc.data().stripeConnectAccountId) {
      return res.status(404).json({ error: 'No Connect account found for this barber' });
    }
    
    const accountId = barberDoc.data().stripeConnectAccountId;
    
    // Create a new account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL || 'https://yourapp.com'}/connect-refresh`,
      return_url: `${process.env.FRONTEND_URL || 'https://yourapp.com'}/connect-return`,
      type: 'account_onboarding',
    });
    
    res.json({ accountLinkUrl: accountLink.url });
    
  } catch (error) {
    console.error('Error resuming Connect onboarding:', error);
    res.status(500).json({
      error: 'Failed to resume Connect onboarding',
      details: error.message
    });
  }
};

/**
 * @route GET /api/connect/status
 * @description Get the status of a barber's Connect account
 * @access Private - requires authentication
 */
exports.getConnectStatus = async (req, res) => {
  try {
    // Get the user ID from the authenticated request
    const userId = req.user.uid;
    
    // Get the barber's Connect account ID
    const barberDoc = await db.collection('barbers').doc(userId).get();
    
    if (!barberDoc.exists) {
      return res.status(404).json({ error: 'Barber not found' });
    }
    
    const barberData = barberDoc.data();
    
    // If no Connect account exists, return not_started status
    if (!barberData.stripeConnectAccountId) {
      return res.json({
        status: 'not_started',
        message: 'No Connect account has been created yet.'
      });
    }
    
    // Retrieve the Connect account from Stripe
    const account = await stripe.accounts.retrieve(barberData.stripeConnectAccountId);
    
    // Check the account status
    if (account.payouts_enabled) {
      // Account is fully verified
      await db.collection('barbers').doc(userId).update({
        stripeConnectStatus: 'verified',
        stripeConnectVerifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.json({
        status: 'verified',
        message: 'Your account is fully verified and can receive payments.',
        capabilities: account.capabilities
      });
    }
    
    if (account.details_submitted) {
      // Details submitted but still being verified
      await db.collection('barbers').doc(userId).update({
        stripeConnectStatus: 'pending'
      });
      
      return res.json({
        status: 'pending',
        message: 'Your information is being verified by Stripe. This can take 1-2 business days.'
      });
    }
    
    // Check for specific requirements
    if (account.requirements && account.requirements.currently_due.length > 0) {
      // There are pending requirements
      await db.collection('barbers').doc(userId).update({
        stripeConnectStatus: 'incomplete',
        stripeConnectRequirements: account.requirements.currently_due
      });
      
      return res.json({
        status: 'incomplete',
        message: 'Please complete your account verification.',
        requirements: account.requirements.currently_due,
        pastDue: account.requirements.past_due || []
      });
    }
    
    // Default to incomplete status
    return res.json({
      status: 'incomplete',
      message: 'Please complete your account verification.'
    });
    
  } catch (error) {
    console.error('Error getting Connect status:', error);
    res.status(500).json({
      error: 'Failed to get Connect status',
      details: error.message
    });
  }
};

/**
 * @route POST /api/cancel-subscription
 * @description Cancel a barber's subscription
 * @access Private - requires authentication
 */
exports.cancelSubscription = async (req, res) => {
  try {
    // Get the user ID from the authenticated request
    const userId = req.user.uid;
    
    // Get the barber's subscription info
    const barberDoc = await db.collection('barbers').doc(userId).get();
    
    if (!barberDoc.exists) {
      return res.status(404).json({ error: 'Barber not found' });
    }
    
    const barberData = barberDoc.data();
    
    // If there's a Stripe subscription ID, cancel it in Stripe
    if (barberData.paymentInfo?.stripeSubscriptionId) {
      await stripe.subscriptions.update(barberData.paymentInfo.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
    }
    
    // Update the barber's profile
    await db.collection('barbers').doc(userId).update({
      'paymentInfo.subscriptionActive': false,
      'paymentInfo.subscriptionCancelledAt': admin.firestore.FieldValue.serverTimestamp(),
      'paymentInfo.subscriptionStatus': 'cancelled'
    });
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      error: 'Failed to cancel subscription',
      details: error.message
    });
  }
};

/**
 * Setup webhook handler for Connect account updates
 * This should be added to your webhook handling route
 */
exports.handleConnectWebhook = async (event) => {
  if (event.type === 'account.updated') {
    const account = event.data.object;
    
    try {
      // Find the barber with this Connect account ID
      const barberQuery = await db.collection('barbers')
        .where('stripeConnectAccountId', '==', account.id)
        .limit(1)
        .get();
      
      if (barberQuery.empty) {
        console.log(`No barber found for Connect account ${account.id}`);
        return;
      }
      
      const barberDoc = barberQuery.docs[0];
      const barberId = barberDoc.id;
      
      // Update status in Firestore
      const updateData = {
        stripeConnectDetailsSubmitted: account.details_submitted,
        stripeConnectPayoutsEnabled: account.payouts_enabled,
        stripeConnectUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Set the verification status based on account state
      if (account.payouts_enabled) {
        updateData.stripeConnectStatus = 'verified';
        updateData.stripeConnectVerifiedAt = admin.firestore.FieldValue.serverTimestamp();
      } else if (account.details_submitted) {
        updateData.stripeConnectStatus = 'pending';
      } else {
        updateData.stripeConnectStatus = 'incomplete';
      }
      
      // Store requirements if they exist
      if (account.requirements) {
        updateData.stripeConnectRequirements = account.requirements.currently_due || [];
        updateData.stripeConnectPastDue = account.requirements.past_due || [];
      }
      
      await db.collection('barbers').doc(barberId).update(updateData);
      
      console.log(`Updated Connect account status for barber ${barberId}`);
      
      // TODO: Send push notification to barber about verification status
      
    } catch (error) {
      console.error('Error processing Connect account update webhook:', error);
    }
  }
};