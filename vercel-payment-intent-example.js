// Vercel serverless function for creating payment intents
// Save this file as api/create-payment-intent.js in your Vercel project

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Set CORS headers if needed
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { amount, description, metadata = {} } = req.body;
    
    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid amount is required' 
      });
    }
    
    if (!metadata.userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required in metadata' 
      });
    }
    
    // Log that we're processing a payment
    console.log(`Processing payment in PRODUCTION mode for $${amount}`);
    console.log(`- Description: ${description}`);
    console.log(`- Metadata:`, JSON.stringify(metadata));
    
    // Create a customer (or retrieve existing one)
    const customer = await stripe.customers.create({
      metadata: {
        userId: metadata.userId,
        appointmentId: metadata.appointmentId || 'none',
        timestamp: new Date().toISOString()
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
    
    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      paymentIntentId: paymentIntent.id,
      mode: 'production' // Always using production mode
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
}