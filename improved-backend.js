const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Environment configuration with better error messages
const getRequiredEnvVar = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`⛔ CRITICAL ERROR: Required environment variable ${name} is not set`);
    console.error(`Please set ${name} in your .env file or hosting environment`);
    process.exit(1);
  }
  return value;
};

// Get Stripe secret key based on environment
const STRIPE_SECRET_KEY = getRequiredEnvVar('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Stripe with proper API version
const stripe = require('stripe')(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Explicitly set API version to match client
  typescript: false
});

const app = express();

// Middleware for parsing JSON and raw bodies
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.endsWith('/webhook')) {
      req.rawBody = buf;
    }
  }
}));

// Configure CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic security middleware
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint with diagnostic info
app.get('/health', (req, res) => {
  const stripeVersion = stripe.getApiField('version');
  
  res.status(200).json({
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    stripeApiVersion: stripeVersion,
    serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
});

// Create payment intent endpoint with better error handling
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, description, metadata = {}, currency = 'usd' } = req.body;
    
    // Enhanced validation with descriptive errors
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid positive amount is required'
      });
    }
    
    // Convert amount to cents for Stripe (ensuring proper rounding)
    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    console.log(`Creating payment intent: $${amount} (${amountInCents} cents)`);
    console.log(`Description: ${description}`);
    console.log(`Metadata:`, JSON.stringify(metadata));

    // Create or retrieve customer
    const customer = await stripe.customers.create({
      metadata: {
        userId: metadata.userId || 'anonymous',
        appointmentId: metadata.appointmentId || 'none',
        timestamp: new Date().toISOString()
      }
    });

    // Create ephemeral key for the customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' } // Match the client SDK version
    );

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      customer: customer.id,
      description,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Log client secret format for debugging
    const clientSecret = paymentIntent.client_secret;
    const clientSecretPrefix = clientSecret ? clientSecret.split('_')[0] : 'unknown';
    console.log(`Generated client secret with prefix: ${clientSecretPrefix}_***`);
    
    // Return successful response with all needed data
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      paymentIntentId: paymentIntent.id,
      mode: process.env.NODE_ENV || 'development',
      amount: amountInCents
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    // Structured error response
    res.status(400).json({
      success: false,
      error: error.message,
      type: error.type || 'unknown_error',
      code: error.code || 'unknown',
      timestamp: new Date().toISOString()
    });
  }
});

// Create subscription endpoint
app.post('/api/create-subscription', async (req, res) => {
  try {
    const { customerId, priceId, metadata = {} } = req.body;
    
    // Validate required fields
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }
    
    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: 'Price ID is required'
      });
    }
    
    console.log(`Creating subscription for customer ${customerId} with price ${priceId}`);
    
    // Get or create the customer
    let customer;
    try {
      // Try to retrieve the customer first
      customer = await stripe.customers.retrieve(customerId);
    } catch (e) {
      // If not found, create a new customer
      customer = await stripe.customers.create({
        id: customerId,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString()
        }
      });
    }
    
    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString()
      }
    });
    
    // Get the client secret from the subscription's invoice
    const clientSecret = subscription.latest_invoice.payment_intent.client_secret;
    
    // Log client secret format for debugging
    const clientSecretPrefix = clientSecret ? clientSecret.split('_')[0] : 'unknown';
    console.log(`Generated subscription client secret with prefix: ${clientSecretPrefix}_***`);
    
    res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret: clientSecret,
      customer: customer.id
    });
    
  } catch (error) {
    console.error('Error creating subscription:', error);
    
    res.status(400).json({
      success: false,
      error: error.message,
      type: error.type || 'unknown_error',
      code: error.code || 'unknown',
      timestamp: new Date().toISOString()
    });
  }
});

// Special middleware just for webhook endpoint
const webhookMiddleware = express.raw({type: 'application/json'});

// Webhook endpoint with better signature verification
app.post('/webhook', webhookMiddleware, async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  if (!STRIPE_WEBHOOK_SECRET) {
    console.warn('⚠️ Webhook secret not configured - skipping signature verification');
    return res.status(400).json({
      success: false,
      error: 'Webhook secret not configured'
    });
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`⛔ Webhook signature verification failed:`, err.message);
    return res.status(400).json({
      success: false,
      error: `Webhook Error: ${err.message}`
    });
  }
  
  console.log(`Received webhook event: ${event.type}`);
  
  // Handle different event types
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
        // Process successful payment
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`PaymentIntent failed: ${failedPayment.id}`);
        // Handle failed payment
        break;
        
      case 'customer.subscription.created':
        const subscription = event.data.object;
        console.log(`Subscription created: ${subscription.id}`);
        // Handle new subscription
        break;
        
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        console.log(`Subscription updated: ${updatedSubscription.id}`);
        // Handle subscription update
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        console.log(`Subscription deleted: ${deletedSubscription.id}`);
        // Handle subscription cancellation
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Acknowledge receipt of the event
    res.json({received: true});
    
  } catch (err) {
    console.error(`Error handling webhook: ${err.message}`);
    res.status(500).json({
      success: false,
      error: `Webhook processing error: ${err.message}`
    });
  }
});

// General error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const errorId = Date.now().toString();
  
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred',
    errorId,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found: The requested endpoint does not exist',
    path: req.originalUrl
  });
});

// Start the server with better error handling
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`
✅ Stripe Backend Server Running
----------------------------------
🔌 Port: ${port}
🔑 API Version: ${stripe.getApiField('version')}
🔒 Environment: ${process.env.NODE_ENV || 'development'}
⚡ Available Endpoints:
   - GET  /health
   - POST /api/create-payment-intent
   - POST /api/create-subscription
   - POST /webhook
----------------------------------
  `);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;