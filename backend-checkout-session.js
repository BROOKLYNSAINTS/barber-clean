/**
 * Backend endpoint for creating a Stripe Checkout session
 * Add this to your server-side code (e.g., in the barber-backend)
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * @route POST /api/create-checkout-session
 * @description Create a Stripe Checkout session for web-based payment
 * @access Public
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const { 
      amount = 2999, 
      currency = 'usd', 
      customerInfo, 
      successUrl,
      cancelUrl 
    } = req.body;
    
    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing redirect URLs' });
    }
    
    // Create or retrieve a Stripe customer
    let customer;
    if (customerInfo?.email) {
      // Check if customer already exists with this email
      const customers = await stripe.customers.list({
        email: customerInfo.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        // Create a new customer
        customer = await stripe.customers.create({
          email: customerInfo.email,
          name: customerInfo.name,
          metadata: {
            userId: customerInfo.userId
          }
        });
      }
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Barber Pro Subscription',
              description: 'Monthly subscription to Barber Pro services'
            },
            unit_amount: amount,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: customer?.id,
    });
    
    // Return the session URL
    res.status(200).json({ 
      url: session.url,
      sessionId: session.id
    });
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session', 
      details: error.message 
    });
  }
};

/**
 * @route GET /payment-success
 * @description Handle successful payments
 * @access Public
 */
exports.handlePaymentSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).send(`
        <html>
          <head><title>Payment Error</title></head>
          <body>
            <h1>Error: Missing session ID</h1>
            <p>Please return to the app.</p>
            <script>
              // This will help communicate back to the WebView in the app
              setTimeout(() => {
                window.location.href = "/payment-success-redirect?success=false&error=missing_session_id";
              }, 2000);
            </script>
          </body>
        </html>
      `);
    }
    
    // Retrieve the session to verify payment status
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      // Payment was successful
      // Update your database to mark the subscription as active
      
      // Return success page
      return res.status(200).send(`
        <html>
          <head><title>Payment Successful</title></head>
          <body>
            <h1>Payment Successful!</h1>
            <p>Your subscription has been activated.</p>
            <p>You can close this window and return to the app.</p>
            <script>
              // This will help communicate back to the WebView in the app
              setTimeout(() => {
                window.location.href = "/payment-success-redirect?success=true&session_id=${session_id}";
              }, 2000);
            </script>
          </body>
        </html>
      `);
    } else {
      // Payment was not successful
      return res.status(400).send(`
        <html>
          <head><title>Payment Error</title></head>
          <body>
            <h1>Payment Not Completed</h1>
            <p>Your payment was not completed successfully.</p>
            <p>Please return to the app and try again.</p>
            <script>
              // This will help communicate back to the WebView in the app
              setTimeout(() => {
                window.location.href = "/payment-success-redirect?success=false&session_id=${session_id}";
              }, 2000);
            </script>
          </body>
        </html>
      `);
    }
    
  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>An error occurred</h1>
          <p>There was a problem processing your payment verification.</p>
          <p>Please return to the app and check your payment status there.</p>
          <script>
            // This will help communicate back to the WebView in the app
            setTimeout(() => {
              window.location.href = "/payment-success-redirect?success=false&error=server_error";
            }, 2000);
          </script>
        </body>
      </html>
    `);
  }
};

/**
 * @route GET /payment-cancel
 * @description Handle cancelled payments
 * @access Public
 */
exports.handlePaymentCancel = async (req, res) => {
  return res.status(200).send(`
    <html>
      <head><title>Payment Cancelled</title></head>
      <body>
        <h1>Payment Cancelled</h1>
        <p>You have cancelled the payment process.</p>
        <p>You can close this window and return to the app.</p>
        <script>
          // This will help communicate back to the WebView in the app
          setTimeout(() => {
            window.location.href = "/payment-cancel-redirect";
          }, 2000);
        </script>
      </body>
    </html>
  `);
};