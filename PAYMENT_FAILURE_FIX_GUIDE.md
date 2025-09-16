# Stripe Payment Failure Fix Guide

## Problem Summary

The issue you're experiencing with "Payment Failed" errors around line 327 in subscription-payment.js is primarily related to how the app handles different types of payment failures from the Stripe Payment Sheet.

The error occurs when a payment attempt fails for various reasons (card declined, insufficient funds, etc.) and Stripe returns error information that needs to be properly interpreted and displayed to the user.

## Step-by-Step Fix Implementation

### 1. Enhanced Error Handling for Different Failure Types

Update the error handling block around line 327 to provide more detailed error messages based on specific error types:

```javascript
if (presentError.code === "Failed") {
  errorTitle = "Payment Failed";
  
  // Provide more specific guidance based on the Stripe error code
  if (presentError.stripeErrorCode === "card_declined") {
    if (presentError.declineCode === "insufficient_funds") {
      errorMessage = "Your card has insufficient funds. Please try a different card.";
    } else if (presentError.declineCode === "lost_card" || presentError.declineCode === "stolen_card") {
      errorMessage = "This card has been reported lost or stolen and cannot be used.";
    } else if (presentError.declineCode === "expired_card") {
      errorMessage = "Your card has expired. Please use a different card.";
    } else {
      errorMessage = "Your card was declined. Please try a different payment method.";
    }
  } else if (presentError.stripeErrorCode === "processing_error") {
    errorMessage = "There was an error processing your card. Please try again or use a different card.";
  } else if (presentError.stripeErrorCode === "incorrect_cvc") {
    errorMessage = "The security code (CVC) you entered is incorrect. Please check and try again.";
  } else {
    errorMessage = "The payment could not be processed. Please check your payment details and try again.";
  }
} else if (presentError.code === "Timeout") {
  errorTitle = "Connection Timeout";
  errorMessage = "The payment request timed out. Please check your internet connection and try again.";
} else if (presentError.code === "NotSupported") {
  errorTitle = "Not Supported";
  errorMessage = "This payment method is not supported on your device. Please try a different payment method.";
}
```

### 2. Add Diagnostic Codes for Support Reference

Include diagnostic codes in error messages to make it easier to identify specific errors when users report problems:

```javascript
// Include a diagnostic code for customer support
const diagnosticCode = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
console.log(`Payment error diagnostic code: ${diagnosticCode}`);

Alert.alert(
  errorTitle, 
  `${errorMessage}\n\n(Reference: ${diagnosticCode})`,
  [{ text: "OK" }]
);
```

### 3. Improve Payment Sheet Initialization Error Handling

Ensure the payment sheet initialization errors are also handled properly:

```javascript
const { error } = await initPaymentSheet(paymentSheetParams);

if (error) {
    // Enhanced error logging
    console.error("initPaymentSheet error:", {
        code: error.code,
        message: error.message,
        stripeErrorCode: error.stripeErrorCode || 'none',
        declineCode: error.declineCode || 'none',
        type: error.type || 'unknown',
        details: JSON.stringify(error)
    });
    
    // More descriptive error message based on error code
    let errorTitle = "Payment Setup Error";
    let errorMessage = error.message;
    
    switch (error.code) {
        case "Failed":
            errorMessage = "We couldn't set up the payment. Please check your internet connection and try again.";
            break;
        case "InvalidRequestError":
            errorMessage = "There was an issue with our payment system configuration.";
            break;
        case "AuthenticationError":
            errorMessage = "Payment authentication failed. Please try again or contact support.";
            break;
        default:
            errorMessage = `Payment setup failed: ${error.message}`;
    }
    
    Alert.alert(errorTitle, errorMessage);
    return false;
}
```

### 4. Extract Error Handling to a Utility Function (Using the new stripe-error-guide.js)

Now that you have the stripe-error-guide.js utility, you can simplify your code by using it:

```javascript
import { handleStripeError } from "@/utils/stripe-error-guide";

// When handling payment errors:
const { title, message, recoverable, diagnosticCode } = handleStripeError(presentError);

Alert.alert(
  title,
  `${message}\n\n(Reference: ${diagnosticCode})`,
  [{ text: "OK" }]
);
```

### 5. Enhance Initialization Parameter Validation

Add more validation to the payment sheet initialization parameters:

```javascript
// Create initialization parameters object first for better debugging
const paymentSheetParams = {
    merchantDisplayName: "ScheduleSync AI LLC",
    customerId: customer,
    customerEphemeralKeySecret: ephemeralKey,
    paymentIntentClientSecret: clientSecret,
    // Set to false for more compatibility
    allowsDelayedPaymentMethods: false,
    returnURL: "barberapp://payment-return",
    defaultBillingDetails: {
        name: profile?.name || "Valued Customer",
    },
    // Add additional configuration for better compatibility
    appearance: {
        colors: {
            primary: theme.colors.primary,
            background: '#FFFFFF',
            componentBackground: '#F5F5F5',
            componentBorder: '#E0E0E0',
            componentDivider: '#E0E0E0',
            primaryText: '#000000',
            secondaryText: '#767676',
            componentText: '#000000',
        }
    }
};

// Validate required parameters
if (!paymentSheetParams.paymentIntentClientSecret) {
    console.error("Missing client secret");
    throw new Error("Invalid payment configuration: Missing client secret");
}
```

## Testing Your Implementation

### 1. Use the Test Cards from Stripe

Test the improved error handling with various test cards:

- **4242424242424242**: Successful payment
- **4000000000000002**: Generic decline
- **4000000000009995**: Insufficient funds
- **4000000000009987**: Lost card
- **4000000000009979**: Stolen card
- **4000000000000069**: Expired card
- **4000000000000119**: Processing error

### 2. Use the test-stripe-failures.js Script

The provided test script can help validate the error handling:

```bash
node test-stripe-failures.js
```

This script simulates different payment failure scenarios and shows the expected error handling.

### 3. Check the Stripe Dashboard

After testing, review the Stripe Dashboard to verify that payment attempts are being correctly logged with appropriate error information.

## Diagnostic Tools

### 1. stripe-diagnostics.js Screen

Navigate to this screen in your app to run payment system diagnostics that will check:
- Network connectivity
- Backend health
- Stripe configuration
- Test payment creation

### 2. Logging and Diagnostic Codes

When users report payment issues, ask them for the diagnostic code displayed in the error message. This will help identify the specific error in your logs.

## Verifying the Fix

After implementing these changes, you should see:

1. More specific error messages for different payment failure reasons
2. Better guidance for users on how to resolve payment issues
3. Improved error logging for debugging
4. Diagnostic codes in error messages for support reference

## Common Issues to Watch For

- **Missing Parameters**: Ensure all required parameters are passed to the payment sheet
- **Environment Mismatch**: Check that you're using the correct Stripe keys for the environment
- **Network Connectivity**: Payment processing requires stable internet connection
- **Backend Errors**: Verify your backend is correctly creating payment intents
- **Test vs. Live Mode**: Ensure you're using test cards in test mode only

By following these steps, you'll have a much more robust payment error handling system that provides clear guidance to users when payments fail for various reasons.