# Stripe Connect Platform Guide for Barber App

## Understanding Your Platform Model

Your barber app uses Stripe Connect to:

1. **Collect payments from customers** for haircuts
2. **Distribute earnings to barbers** (minus your platform fee)
3. **Charge subscription fees** to barbers for using your platform

This guide explains the barber onboarding process and helps troubleshoot common issues.

## Barber Onboarding Flow

When a barber signs up for your platform, they go through these steps:

1. **Barber creates account** in your app
2. **Barber subscribes** to your platform
3. **Stripe Connect onboarding** starts automatically
   - Barber is redirected to a Stripe-hosted page
   - They provide identity verification (ID, banking info, etc.)
   - This is REQUIRED for them to receive payments
4. **Verification processing** (can take minutes to days)
5. **Barber can receive payments** once verified

## Common Issues & Solutions

### 1. Barbers Abandoning Verification

**Problem**: Barbers start the verification process but don't complete it

**Solution**:
- Set clear expectations BEFORE they start
- Let them know what documents they'll need upfront
- Implement a follow-up system for abandoned verifications
- Add a "resume verification" button in their dashboard

### 2. Payment Method Selection Not Appearing

**Problem**: Barber can't see payment methods during subscription

**Solution**:
- Ensure your Stripe Connect Platform is fully verified
- Check if your account has card_payments capability
- Verify you're using the correct API version
- Test with different country settings (some countries have restrictions)

### 3. Failed Verifications

**Problem**: Barber completes form but verification fails

**Solution**:
- Implement webhook monitoring for `account.updated` events
- Check for specific requirements in the requirements.currently_due field
- Provide specific guidance based on the missing requirements
- Add a support contact option for verification issues

## Code Implementation Examples

### Creating a Connect Account for a Barber

```javascript
// When a barber signs up
async function onboardBarberToStripe(barber) {
  // 1. Create a Connected account
  const account = await stripe.accounts.create({
    type: 'express', // Recommended for most platforms
    email: barber.email,
    business_type: 'individual',
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
  
  // 4. Return the URL for redirect
  return accountLink.url;
}
```

### Setting Up Subscription During Onboarding

```javascript
// In your subscription handler
async function createBarberSubscription(barber, paymentMethodId) {
  // 1. Check if barber has a Connect account yet
  let connectAccountId = barber.stripeConnectAccountId;
  
  // 2. If not, create one
  if (!connectAccountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: barber.email,
      metadata: { barberId: barber.id }
    });
    connectAccountId = account.id;
    await updateBarber(barber.id, { stripeConnectAccountId: connectAccountId });
  }
  
  // 3. Create a customer if they don't have one
  if (!barber.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: barber.email,
      name: barber.name,
      metadata: { barberId: barber.id }
    });
    await updateBarber(barber.id, { stripeCustomerId: customer.id });
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });
    
    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }
  
  // 4. Create the subscription
  const subscription = await stripe.subscriptions.create({
    customer: barber.stripeCustomerId,
    items: [{ price: 'price_your_subscription_price_id' }],
    expand: ['latest_invoice.payment_intent'],
  });
  
  // 5. Create the account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: connectAccountId,
    refresh_url: 'https://yourapp.com/connect/reauth',
    return_url: 'https://yourapp.com/connect/return?subscription_id=' + subscription.id,
    type: 'account_onboarding',
  });
  
  // 6. Return both the subscription and the onboarding URL
  return {
    subscription,
    accountLinkUrl: accountLink.url
  };
}
```

## Backend Endpoint for Checking Onboarding Status

```javascript
app.get('/api/connect/account-status', async (req, res) => {
  try {
    const barber = await getBarberFromAuth(req);
    
    if (!barber.stripeConnectAccountId) {
      return res.json({
        status: 'not_started',
        message: 'You have not started the verification process.'
      });
    }
    
    const account = await stripe.accounts.retrieve(barber.stripeConnectAccountId);
    
    // Check account status
    if (account.payouts_enabled) {
      return res.json({
        status: 'verified',
        message: 'Your account is fully verified. You can receive payments.'
      });
    }
    
    if (account.details_submitted) {
      return res.json({
        status: 'pending',
        message: 'Your information is being verified by Stripe. This can take 1-2 business days.'
      });
    }
    
    // Check if there are specific requirements
    if (account.requirements && account.requirements.currently_due.length > 0) {
      return res.json({
        status: 'incomplete',
        message: 'Please complete your account verification.',
        requirements: account.requirements.currently_due,
        pastDue: account.requirements.past_due
      });
    }
    
    return res.json({
      status: 'incomplete',
      message: 'Please complete your account verification.'
    });
    
  } catch (error) {
    console.error('Error checking account status:', error);
    res.status(500).json({ error: 'Failed to check account status' });
  }
});
```

## Webhooks for Monitoring Connect Events

It's crucial to implement webhooks to monitor the status of your Connect accounts:

```javascript
app.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle Connect account updates
  if (event.type === 'account.updated') {
    const account = event.data.object;
    
    // Find the barber with this Connect account ID
    const barber = await findBarberByConnectId(account.id);
    if (!barber) return res.status(200).send('No barber found for this account');
    
    // Update status in your database
    await updateBarber(barber.id, {
      stripeVerified: account.payouts_enabled,
      stripeDetailsSubmitted: account.details_submitted,
      stripeRequirements: account.requirements?.currently_due || []
    });
    
    // Send notification if verification is complete
    if (account.payouts_enabled && !barber.stripeVerified) {
      await sendNotification(
        barber.id,
        'Your account verification is complete! You can now receive payments.'
      );
    }
    
    // Send notification if there are new requirements
    if (account.requirements?.currently_due.length > 0) {
      await sendNotification(
        barber.id,
        'Your account needs additional information. Please log in to complete verification.'
      );
    }
  }
  
  res.status(200).send('Webhook received');
});
```

## Testing Your Connect Integration

1. Use Stripe's test mode to simulate the entire flow
2. Create test Connect accounts using test data
3. Use Stripe's test verification data:
   - Test ID: Use any image with the word "identity_document" in the name
   - Test Address: Any address in a supported country
   - Test SSN: Use "000-00-0000" in the US

## Need More Help?

- Check the [Stripe Connect documentation](https://stripe.com/docs/connect)
- Use the diagnostic tool: `node check-stripe-connect.js`
- Review your Connect settings in the [Stripe Dashboard](https://dashboard.stripe.com/connect/overview)