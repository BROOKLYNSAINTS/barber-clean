# Stripe Payment Failures Troubleshooting Guide

## Common Payment Error: "Payment Failed" at line 327

If you're seeing "Payment Failed" errors in your subscription-payment.js file around line 327, this guide will help you diagnose and fix the issue.

## Diagnosis Steps

1. **Check the Error Code**
   - `Failed`: General payment failure
   - `Canceled`: User canceled the payment
   - `Timeout`: Network or processing timeout
   - `NotSupported`: Payment method not supported on device

2. **Examine the Stripe Error Code**
   - `card_declined`: Card was declined by issuer
   - `insufficient_funds`: Card has no available balance
   - `expired_card`: Card is expired
   - `incorrect_cvc`: CVC number is incorrect
   - `processing_error`: Generic processing error

3. **Look for Decline Codes**
   - `generic_decline`: General decline without specific reason
   - `fraudulent`: Payment flagged as potentially fraudulent
   - `lost_card` or `stolen_card`: Card reported lost or stolen

## Common Causes and Solutions

### 1. Integration Issues

**Symptoms:**
- Payment sheet won't initialize
- "Could not initialize payment sheet" errors

**Solutions:**
- Ensure all parameters are correctly passed to `initPaymentSheet()`
- Verify backend returns all required fields (clientSecret, ephemeralKey, customer)
- Make sure API keys match environment (test/live)
- Check merchantDisplayName is set properly

### 2. Card Declined Issues

**Symptoms:**
- Payment sheet initializes but payment fails
- "Failed" error code with stripeErrorCode "card_declined"

**Solutions:**
- Test with multiple cards to verify the issue
- In test mode, ensure you're using valid [Stripe test cards](https://stripe.com/docs/testing)
- In production, ensure the Stripe account can process live payments
- Verify customer has sufficient funds

### 3. Configuration Mismatches

**Symptoms:**
- Inconsistent payment behavior between environments
- Works in development but not in TestFlight

**Solutions:**
- Check app.config.js for proper environment handling
- Verify stripeConfig.js is selecting the correct publishable key
- Ensure backend URL is accessible from all environments
- Check if TestFlight detection is working properly

## Debugging Tools

1. **Run stripe-diagnostics.js**
   - Add the diagnostic screen to your app and use it to test the integration
   - Access comprehensive information about your Stripe setup

2. **Run stripe-payment-test.js**
   - Use this script to test the backend API directly
   - Verify payment intent creation works correctly

3. **Check Enhanced Error Logging**
   - We've added comprehensive error logging to the payment flow
   - Look for diagnostic codes in error messages for easier tracking

## Specific Fixes Implemented

1. **Enhanced Error Handling**
   - Added detailed error messages based on specific error codes
   - Improved error logging with all relevant parameters

2. **Improved Payment Sheet Initialization**
   - Created separate paymentSheetParams object for better debugging
   - Added validation for required parameters

3. **Better User Experience**
   - More descriptive error messages with specific guidance
   - Diagnostic codes for easier support

4. **Comprehensive Diagnostics**
   - Added stripe-diagnostics.js screen for in-app troubleshooting
   - Created test scripts for backend API verification

## For End Users

If you continue to experience payment failures:

1. Make sure your card is valid and has sufficient funds
2. Try a different payment method if available
3. Check your internet connection
4. Note the error code and contact support if issues persist

## For Developers

Remember to check:
1. Stripe Dashboard for any account restrictions
2. API versions match between frontend and backend
3. Required parameters are included in all API calls
4. Webhook configuration if using webhooks

This improved error handling should help diagnose and fix the "Payment Failed" errors occurring around line 327 in your subscription-payment.js file.