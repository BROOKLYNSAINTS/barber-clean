# Stripe Integration Setup Guide

## Overview
This guide will help you integrate your Stripe sandbox with the barber app for real payment processing.

## Prerequisites
1. Stripe account with test mode enabled
2. Stripe publishable and secret keys
3. Backend server to handle payment intents (template provided)

## Step 1: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

## Step 2: Update Environment Variables

Add your Stripe publishable key to your `.env` file:

```env
# Add this line to your .env file
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
```

## Step 3: Set Up Backend Server

1. Use the `backend-stripe-template.js` file as a starting point
2. Replace `sk_test_YOUR_STRIPE_SECRET_KEY_HERE` with your actual secret key
3. Deploy to a service like:
   - **Vercel** (recommended for quick setup)
   - **Railway**
   - **Heroku**
   - **AWS Lambda**
   - **Google Cloud Functions**

### Quick Vercel Deployment:
```bash
# Create a new directory for your backend
mkdir barber-backend
cd barber-backend

# Copy the template
cp ../barber-clean/backend-stripe-template.js index.js

# Initialize package.json
npm init -y

# Install dependencies
npm install express stripe cors

# Create vercel.json
echo '{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ]
}' > vercel.json

# Deploy to Vercel
npx vercel --prod
```

## Step 4: Update Frontend to Use Your Backend

Once your backend is deployed, update the `createPaymentIntent` function in `src/services/stripe.js`:

```javascript
// Replace the simulated response with real fetch call
const createPaymentIntent = async (amount, description, metadata) => {
  try {
    const response = await fetch('https://your-backend-url.vercel.app/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        description,
        metadata,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create payment intent');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return { success: false, error: error.message };
  }
};
```

## Step 5: Set Up Webhooks (Recommended)

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Add your backend URL + `/webhook` (e.g., `https://your-backend.vercel.app/webhook`)
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook secret and update your backend

## Step 6: Test the Integration

1. Start your app: `npx expo start`
2. Navigate to an appointment details screen
3. Tap the "Pay" button
4. Use Stripe test cards:
   - **Success**: `4242424242424242`
   - **Decline**: `4000000000000002`
   - **Requires authentication**: `4000002500003155`

## Current Implementation Features

✅ **Working Now:**
- Firestore permissions configured
- Payment UI integrated
- Demo payment flow working

🚧 **Needs Backend:**
- Real Stripe payment intent creation
- Payment sheet initialization with real data
- Webhook handling for payment confirmation

💳 **Payment Flow:**
1. User taps "Pay" button
2. App calls backend to create PaymentIntent
3. Stripe payment sheet opens with real card form
4. User enters payment details
5. Payment is processed by Stripe
6. App receives confirmation and updates Firestore
7. Webhook confirms payment server-side

## Test Cards

| Card Number | Description |
|-------------|-------------|
| 4242424242424242 | Visa - Success |
| 4000000000000002 | Generic decline |
| 4000000000009995 | Insufficient funds |
| 4000002500003155 | Requires authentication |

Use any future expiry date and any 3-digit CVC.

## Troubleshooting

### "Payment system needs backend configuration"
- Your backend URL is not configured in `createPaymentIntent`
- Backend is not deployed or not responding

### "Missing or insufficient permissions"
- Firestore rules should now be fixed
- Check Firebase console for rule deployment

### Payment sheet doesn't open
- Check that Stripe publishable key is correctly set
- Verify backend is returning valid payment intent data

### Webhooks not working
- Check webhook URL is accessible
- Verify webhook secret is correct
- Check Stripe dashboard for webhook delivery attempts

## Next Steps for Production

1. Replace test keys with live keys
2. Implement proper error handling
3. Add payment method storage
4. Implement refunds
5. Add comprehensive logging
6. Set up monitoring and alerts
