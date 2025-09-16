# Troubleshooting the Stripe Payment Sheet Initialization Issue

## Issue Description
The error occurs when initializing the Stripe Payment Sheet in the subscription-payment.js file. The app shows "Payment Error Could not initialize payment sheet" when trying to process a payment.

## Root Causes Found
1. **Code Corruption**: The subscription-payment.js file had syntax errors from previous edits
2. **Variable Name Mismatch**: Inconsistency between variable names used when accessing response data
3. **Parameter Structure Issue**: The paymentSheetParams object had improper construction
4. **Environment Configuration**: Missing app.config.js integration with expo-env

## Fix Implemented
1. Fixed the syntax error in the initializePaymentSheet function
2. Ensured consistent variable names (clientSecret, ephemeralKey, customer)
3. Improved error logging with detailed information about parameter values
4. Created separate paymentSheetParams object for better debugging

## Verification Steps
1. Run the debug-payment-sheet.js script to verify backend API returns correct data
2. Verify that initializePaymentSheet function uses correct parameter names
3. Ensure app.config.js includes all necessary environment variables
4. Test the payment flow with the updated code

## Next Steps
If issues persist, check:
1. Stripe SDK version compatibility
2. Network connectivity between app and backend
3. Environment variables and expo-env plugin configuration
4. Test with both development and production builds

## Configuration Notes
- Backend URL: https://barber-backend-ten.vercel.app
- Required parameters for API calls: 
  - service_name
  - barber_name
  - amount
  - currency
- SDK requires:
  - customerEphemeralKeySecret (from ephemeralKey field)
  - paymentIntentClientSecret (from clientSecret field)
  - customerId (from customer field)