// Backend template for Stripe integration
// You'll need to create this as a separate backend service

const express = require('express');
const stripe = require('stripe')('sk_test_YOUR_STRIPE_SECRET_KEY_HERE'); // Replace with your secret key
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Endpoint to create PaymentIntent
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, description, metadata } = req.body;
    
    // Create a customer (or retrieve existing one)
    const customer = await stripe.customers.create({
      metadata: {
        userId: metadata.userId,
        appointmentId: metadata.appointmentId
      }
    });
    
    // Create ephemeral key for customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );
    
    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customer.id,
      description,
      metadata: {
        userId: metadata.userId,
        barberId: metadata.barberId,
        appointmentId: metadata.appointmentId
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      paymentIntentId: paymentIntent.id
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Webhook endpoint to handle Stripe events (recommended for production)
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = 'whsec_YOUR_WEBHOOK_SECRET_HERE'; // Replace with your webhook secret
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!', paymentIntent.id);
      
      // Update your Firestore database here
      // You can use the metadata to identify the appointment and update its status
      
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed!', failedPayment.id);
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.json({ received: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

/* 
Setup Instructions:

1. Install dependencies:
   npm init -y
   npm install express stripe cors

2. Replace 'sk_test_YOUR_STRIPE_SECRET_KEY_HERE' with your actual Stripe secret key from:
   https://dashboard.stripe.com/test/apikeys

3. Set up a webhook endpoint in Stripe dashboard:
   https://dashboard.stripe.com/test/webhooks
   - Add endpoint URL: https://your-backend.com/webhook
   - Select events: payment_intent.succeeded, payment_intent.payment_failed

4. Replace 'whsec_YOUR_WEBHOOK_SECRET_HERE' with your webhook secret

5. Deploy this backend to a service like:
   - Vercel
   - Netlify Functions
   - Railway
   - Heroku
   - AWS Lambda

6. Update the createPaymentIntent function in stripe.js to call your backend:
   Replace the fetch URL with your deployed backend URL
*/
