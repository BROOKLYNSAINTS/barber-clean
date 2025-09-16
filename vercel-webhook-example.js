// Vercel serverless function for Stripe webhook
// Save this file as api/webhook.js in your Vercel project

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// This is a Vercel serverless function that handles Stripe webhooks
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⛔ ERROR: STRIPE_WEBHOOK_SECRET environment variable is not set');
    return res.status(500).send('Webhook Error: Webhook secret not configured');
  }

  try {
    // Get the raw body buffer
    const rawBody = await buffer(req);
    
    // Construct the event using the raw body
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

    console.log(`Processing webhook from PRODUCTION environment - Event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent was successful!`, paymentIntent.id);
        
        // Update your Firestore database here
        // You can use the metadata to identify the appointment and update its status
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`PaymentIntent failed!`, failedPayment.id);
        // Handle failed payment
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return res.json({ received: true });
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}

// Helper function to get raw request body
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}