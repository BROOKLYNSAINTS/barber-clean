// Backend endpoint for checking payment method availability
// Add this to your server-side code (e.g., in the barber-backend)

/**
 * @route POST /api/payment-methods/availability
 * @description Check payment method availability for a specific country
 * @access Public
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getPaymentMethodAvailability = async (req, res) => {
  try {
    const { country, currency = 'usd', amount = 3000, customer } = req.body;
    
    if (!country) {
      return res.status(400).json({ 
        error: 'Missing required parameter: country' 
      });
    }
    
    // Get available payment method types for the specified country
    const paymentMethodTypes = await stripe.paymentMethods.list({
      country,
      limit: 20, // Adjust as needed
    });
    
    // Create a payment intent to check available payment methods
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card'], // Start with card, we'll check what's available
      setup_future_usage: 'off_session',
    });
    
    // Get configuration for payment sheet
    const paymentMethods = [];
    
    // First check for card availability
    try {
      const cardConfig = await stripe.paymentIntents.retrievePaymentMethodOptions(
        paymentIntent.id, 
        { payment_method_type: 'card' }
      );
      
      if (cardConfig) {
        paymentMethods.push({ 
          type: 'card',
          details: {
            supported: true,
            requires3DS: !!cardConfig.requires_authentication
          }
        });
      }
    } catch (err) {
      console.log('Card payment not available:', err.message);
      // Card not available, continue checking other methods
    }
    
    // Check for additional payment methods that might be available
    const additionalMethods = ['ideal', 'sepa_debit', 'giropay', 'eps', 'p24', 'sofort', 'bancontact'];
    
    for (const methodType of additionalMethods) {
      try {
        const methodConfig = await stripe.paymentIntents.retrievePaymentMethodOptions(
          paymentIntent.id, 
          { payment_method_type: methodType }
        );
        
        if (methodConfig) {
          paymentMethods.push({ 
            type: methodType,
            details: { supported: true }
          });
        }
      } catch (err) {
        // This payment method is not available, skip it
      }
    }
    
    // Clean up - cancel the payment intent since we don't need it anymore
    await stripe.paymentIntents.cancel(paymentIntent.id);
    
    return res.json({
      country,
      paymentMethods,
      hasCardPayments: paymentMethods.some(pm => pm.type === 'card'),
      recommendDirectInput: paymentMethods.length === 0 || !paymentMethods.some(pm => pm.type === 'card'),
    });
    
  } catch (error) {
    console.error('Error checking payment method availability:', error);
    return res.status(500).json({
      error: 'Failed to check payment method availability',
      details: error.message
    });
  }
};