# Stripe Payment Method Troubleshooting Guide

## Problem: Payment Sheet Not Showing or "No Payment Methods Available" Error

If you're encountering issues with the Stripe Payment Sheet not appearing, showing a blank screen, or displaying a "No Payment Methods Available" error, this guide provides several alternative approaches to troubleshoot and resolve the issue.

## Option 1: Check Payment Method Availability by Country

Some payment issues are related to country-specific availability of payment methods in Stripe. The included `check-payment-methods.js` utility can help diagnose these issues:

1. **Run the diagnostic tool**:

```bash
# Install required dependencies if needed
npm install node-fetch dotenv readline

# Set your backend URL in a .env file or export it
echo "STRIPE_BACKEND_URL=https://barber-backend-ten.vercel.app" > .env

# Run the tool
node check-payment-methods.js
```

2. **Enter the country code** when prompted (e.g., "US" for United States, "GB" for United Kingdom)

3. **Review the results** to see which payment methods are available for that country

If the results show that card payments are not available in a specific country, you'll need to implement one of the alternative payment approaches below.

## Option 2: Use Direct Card Input Instead of Payment Sheet

The Payment Sheet is a higher-level UI component that may not work in all scenarios. An alternative is to use the direct `CardField` component which provides more flexibility:

1. Navigate to the direct-card-payment.js file in the app
2. This implementation bypasses the Payment Sheet and uses direct card input
3. The direct card implementation:
   - Uses Stripe's CardField component for manual card input
   - Handles payment processing manually
   - Works in scenarios where Payment Sheet has issues

## Option 3: Modify Payment Intent Creation

Sometimes the Payment Sheet doesn't appear because the payment intent is not properly configured:

1. **Check payment intent creation parameters**:
   - Make sure `payment_method_types` includes 'card'
   - Set proper `customer` ID if you're using customer objects
   - Ensure proper metadata and description are set

2. **Adjust your backend code** to ensure the payment intent setup includes all necessary parameters:
   ```javascript
   const paymentIntent = await stripe.paymentIntents.create({
     amount: amount,
     currency: 'usd',
     payment_method_types: ['card'],
     // Add customer if you're using Stripe Customer objects
     // customer: customerId,
     metadata: {
       // Include relevant metadata
     },
   });
   ```

## Option 4: Use Web-based Payment Redirect

If mobile SDK issues persist, consider a web-based payment flow:

1. Create a simple web payment page hosted on your backend
2. Redirect users to this page using a WebView
3. Process the payment on the web
4. Redirect back to the app after completion

## Common Issues & Solutions

| Issue | Possible Solution |
|-------|-------------------|
| Blank payment screen | Try direct card input (Option 2) |
| No payment methods available | Check country availability (Option 1) |
| Payment Sheet initialization fails | Check Stripe SDK version compatibility |
| Backend errors | Verify API keys and backend health |
| No payment methods in specific country | Use web-based redirect (Option 4) |

## Additional Troubleshooting

1. **Check Stripe SDK version compatibility** - Ensure you're using a compatible version with Expo/React Native

2. **Test with test cards** - Use Stripe test cards to validate your payment flow:
   - 4242 4242 4242 4242 (Success)
   - 4000 0000 0000 0002 (Declined)

3. **Debug mode** - Enable debug logs in your Stripe configuration:
   ```javascript
   import { StripeProvider } from '@stripe/stripe-react-native';
   
   <StripeProvider
     publishableKey={publishableKey}
     merchantIdentifier="merchant.com.your.app"
     urlScheme="your-app-scheme"
     debugMode={true} // Enable this for detailed logs
   >
     {/* App content */}
   </StripeProvider>
   ```

## Need More Help?

If issues persist after trying these approaches, consider:
- Checking Stripe's status page for service disruptions
- Contacting Stripe support with detailed logs
- Reviewing your account configuration in the Stripe Dashboard