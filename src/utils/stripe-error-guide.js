/**
 * Stripe Error Guide - Reference for common error codes
 * 
 * This file provides reference information about Stripe error codes
 * and guidance for handling payment failures.
 */

// Error Code Categories
export const STRIPE_ERROR_CATEGORIES = {
  AUTHENTICATION: 'Authentication errors',
  API: 'API errors',
  CARD: 'Card errors',
  IDEMPOTENCY: 'Idempotency errors',
  INVALID_REQUEST: 'Invalid request errors',
  RATE_LIMIT: 'Rate limit errors'
};

// Common Stripe Error Codes
export const STRIPE_ERROR_CODES = {
  // Authentication Errors
  api_key_expired: {
    category: STRIPE_ERROR_CATEGORIES.AUTHENTICATION,
    message: 'The API key provided has expired.',
    developerAction: 'Generate a new API key in the Stripe Dashboard.',
    userMessage: 'The app\'s payment credentials have expired. Please contact support.'
  },
  invalid_api_key: {
    category: STRIPE_ERROR_CATEGORIES.AUTHENTICATION,
    message: 'The API key provided is invalid.',
    developerAction: 'Check that you\'re using the correct API key (publishable vs. secret).',
    userMessage: 'There\'s a payment configuration issue. Please contact support.'
  },
  
  // Card Errors
  card_declined: {
    category: STRIPE_ERROR_CATEGORIES.CARD,
    message: 'The card was declined.',
    developerAction: 'Ask customer to try a different payment method.',
    userMessage: 'Your card was declined. Please try a different payment method.'
  },
  expired_card: {
    category: STRIPE_ERROR_CATEGORIES.CARD,
    message: 'The card has expired.',
    developerAction: 'Ask customer to use a different card.',
    userMessage: 'Your card has expired. Please use a different card.'
  },
  incorrect_cvc: {
    category: STRIPE_ERROR_CATEGORIES.CARD,
    message: 'The card\'s security code is incorrect.',
    developerAction: 'Ask customer to check the CVC/CVV number.',
    userMessage: 'The security code (CVC) you entered is incorrect. Please check and try again.'
  },
  incorrect_number: {
    category: STRIPE_ERROR_CATEGORIES.CARD,
    message: 'The card number is incorrect.',
    developerAction: 'Ask customer to check the card number.',
    userMessage: 'The card number you entered is incorrect. Please check and try again.'
  },
  incomplete_number: {
    category: STRIPE_ERROR_CATEGORIES.CARD,
    message: 'The card number is incomplete.',
    developerAction: 'Ask customer to check the card number length.',
    userMessage: 'The card number is incomplete. Please enter all digits.'
  },
  incomplete_cvc: {
    category: STRIPE_ERROR_CATEGORIES.CARD,
    message: 'The card\'s security code is incomplete.',
    developerAction: 'Ask customer to provide the complete security code.',
    userMessage: 'The security code (CVC) is incomplete. Please enter all digits.'
  },
  invalid_expiry_month: {
    category: STRIPE_ERROR_CATEGORIES.CARD,
    message: 'The card\'s expiration month is invalid.',
    developerAction: 'Ask customer to check the expiration date.',
    userMessage: 'The expiration month is invalid. Please check your card details.'
  },
  invalid_expiry_year: {
    category: STRIPE_ERROR_CATEGORIES.CARD,
    message: 'The card\'s expiration year is invalid.',
    developerAction: 'Ask customer to check the expiration date.',
    userMessage: 'The expiration year is invalid. Please check your card details.'
  },
  processing_error: {
    category: STRIPE_ERROR_CATEGORIES.CARD,
    message: 'An error occurred while processing the card.',
    developerAction: 'This is typically a temporary issue. Ask customer to try again.',
    userMessage: 'There was an error processing your card. Please try again or use a different card.'
  },
  
  // Invalid Request Errors
  amount_too_large: {
    category: STRIPE_ERROR_CATEGORIES.INVALID_REQUEST,
    message: 'The specified amount is greater than the maximum allowed.',
    developerAction: 'Reduce the payment amount.',
    userMessage: 'The payment amount exceeds the maximum allowed. Please contact support.'
  },
  amount_too_small: {
    category: STRIPE_ERROR_CATEGORIES.INVALID_REQUEST,
    message: 'The specified amount is less than the minimum allowed.',
    developerAction: 'Increase the payment amount.',
    userMessage: 'The payment amount is below the minimum allowed. Please contact support.'
  },
  invalid_currency: {
    category: STRIPE_ERROR_CATEGORIES.INVALID_REQUEST,
    message: 'The currency specified is invalid.',
    developerAction: 'Check the currency code used in the request.',
    userMessage: 'There\'s an issue with the currency setting. Please contact support.'
  },
  
  // Rate Limit Errors
  rate_limit: {
    category: STRIPE_ERROR_CATEGORIES.RATE_LIMIT,
    message: 'Too many requests hit the API too quickly.',
    developerAction: 'Implement exponential backoff in your code.',
    userMessage: 'Too many payment attempts. Please try again in a moment.'
  }
};

// Decline Codes from Card Issuers
export const STRIPE_DECLINE_CODES = {
  approve_with_id: {
    message: 'The payment should be approved but requires further verification.',
    userMessage: 'Your card requires additional verification. Please contact your bank.',
    recoverable: true
  },
  call_issuer: {
    message: 'The customer needs to call their card issuer to approve the payment.',
    userMessage: 'Please contact your bank to authorize this payment.',
    recoverable: false
  },
  card_not_supported: {
    message: 'The card does not support this type of purchase.',
    userMessage: 'Your card doesn\'t support this type of purchase. Please use a different card.',
    recoverable: false
  },
  card_velocity_exceeded: {
    message: 'The customer has exceeded the balance or credit limit on their card.',
    userMessage: 'You\'ve exceeded your card\'s limit. Please use a different card.',
    recoverable: false
  },
  currency_not_supported: {
    message: 'The card does not support the specified currency.',
    userMessage: 'Your card doesn\'t support this currency. Please use a different card.',
    recoverable: false
  },
  do_not_honor: {
    message: 'The card issuer declined the payment without providing a reason.',
    userMessage: 'Your card was declined. Please use a different payment method.',
    recoverable: false
  },
  do_not_try_again: {
    message: 'The card issuer declined the payment and requests that no further attempts be made.',
    userMessage: 'This card cannot be used. Please use a different payment method.',
    recoverable: false
  },
  duplicate_transaction: {
    message: 'A transaction with identical amount and credit card information was submitted recently.',
    userMessage: 'A duplicate payment was detected. Please wait a moment before trying again.',
    recoverable: true
  },
  expired_card: {
    message: 'The card has expired.',
    userMessage: 'Your card has expired. Please use a different card.',
    recoverable: false
  },
  fraudulent: {
    message: 'The payment was declined as potentially fraudulent.',
    userMessage: 'The payment was flagged as potentially fraudulent. Please use a different card or contact your bank.',
    recoverable: false
  },
  generic_decline: {
    message: 'The card was declined without a specific reason.',
    userMessage: 'Your card was declined. Please use a different payment method.',
    recoverable: false
  },
  incorrect_number: {
    message: 'The card number is incorrect.',
    userMessage: 'The card number is incorrect. Please check and try again.',
    recoverable: true
  },
  incorrect_cvc: {
    message: 'The CVC number is incorrect.',
    userMessage: 'The security code (CVC) is incorrect. Please check and try again.',
    recoverable: true
  },
  insufficient_funds: {
    message: 'The card has insufficient funds to complete the purchase.',
    userMessage: 'Your card has insufficient funds. Please use a different card.',
    recoverable: false
  },
  invalid_account: {
    message: 'The card or account is invalid.',
    userMessage: 'Your card is invalid. Please use a different payment method.',
    recoverable: false
  },
  invalid_amount: {
    message: 'The payment amount is invalid or exceeds the amount that is allowed.',
    userMessage: 'The payment amount is invalid. Please contact support.',
    recoverable: false
  },
  invalid_cvc: {
    message: 'The CVC number is invalid.',
    userMessage: 'The security code (CVC) is invalid. Please check and try again.',
    recoverable: true
  },
  invalid_expiry_year: {
    message: 'The expiration year is invalid.',
    userMessage: 'The expiration year is invalid. Please check and try again.',
    recoverable: true
  },
  invalid_number: {
    message: 'The card number is invalid.',
    userMessage: 'The card number is invalid. Please check and try again.',
    recoverable: true
  },
  issuer_not_available: {
    message: 'The card issuer could not be reached.',
    userMessage: 'The payment system is currently unavailable. Please try again later.',
    recoverable: true
  },
  lost_card: {
    message: 'The card has been reported lost.',
    userMessage: 'This card has been reported lost and cannot be used.',
    recoverable: false
  },
  merchant_blacklist: {
    message: 'The card is on a merchant blacklist.',
    userMessage: 'This card cannot be used for this merchant. Please use a different card.',
    recoverable: false
  },
  new_account_information_available: {
    message: 'The card has been updated, and you should use the new information.',
    userMessage: 'This card has been updated. Please use the updated card information.',
    recoverable: true
  },
  no_action_taken: {
    message: 'The card issuer declined the payment but provided no reason.',
    userMessage: 'Your card was declined. Please use a different payment method.',
    recoverable: false
  },
  not_permitted: {
    message: 'The payment is not permitted.',
    userMessage: 'This type of payment is not permitted with this card. Please use a different payment method.',
    recoverable: false
  },
  offline_pin_required: {
    message: 'The card requires a PIN for in-person transactions.',
    userMessage: 'This card requires a PIN for in-person transactions. Please use a different card.',
    recoverable: false
  },
  online_or_offline_pin_required: {
    message: 'The card requires a PIN.',
    userMessage: 'This card requires a PIN. Please use a different card.',
    recoverable: false
  },
  pickup_card: {
    message: 'The card cannot be used and should be picked up.',
    userMessage: 'This card cannot be used. Please contact your bank.',
    recoverable: false
  },
  pin_try_exceeded: {
    message: 'The allowable number of PIN tries has been exceeded.',
    userMessage: 'Too many incorrect PIN attempts. Please use a different card.',
    recoverable: false
  },
  processing_error: {
    message: 'An error occurred while processing the card.',
    userMessage: 'An error occurred while processing your payment. Please try again.',
    recoverable: true
  },
  reenter_transaction: {
    message: 'The payment could not be processed and should be tried again.',
    userMessage: 'Please try this payment again.',
    recoverable: true
  },
  restricted_card: {
    message: 'The card cannot be used to make this payment.',
    userMessage: 'This card is restricted and cannot be used. Please use a different payment method.',
    recoverable: false
  },
  revocation_of_all_authorizations: {
    message: 'The card has been declined for all authorizations.',
    userMessage: 'This card has been declined. Please use a different payment method.',
    recoverable: false
  },
  revocation_of_authorization: {
    message: 'The card has been declined for this authorization.',
    userMessage: 'This payment was declined. Please use a different payment method.',
    recoverable: false
  },
  security_violation: {
    message: 'The transaction has been declined due to a security violation.',
    userMessage: 'This payment was declined due to security concerns. Please use a different payment method.',
    recoverable: false
  },
  service_not_allowed: {
    message: 'The card doesn\'t support this type of purchase.',
    userMessage: 'Your card doesn\'t support this type of purchase. Please use a different card.',
    recoverable: false
  },
  stolen_card: {
    message: 'The card has been reported stolen.',
    userMessage: 'This card has been reported stolen and cannot be used.',
    recoverable: false
  },
  stop_payment_order: {
    message: 'The card has a stop payment order.',
    userMessage: 'This payment has been stopped. Please use a different payment method.',
    recoverable: false
  },
  testmode_decline: {
    message: 'A test card was declined in test mode.',
    userMessage: 'This test card was declined. In production, real cards would be processed normally.',
    recoverable: true
  },
  transaction_not_allowed: {
    message: 'The card does not support this type of transaction.',
    userMessage: 'Your card doesn\'t support this type of transaction. Please use a different card.',
    recoverable: false
  },
  try_again_later: {
    message: 'The payment could not be processed. Try again later.',
    userMessage: 'The payment couldn\'t be processed right now. Please try again in a few moments.',
    recoverable: true
  },
  withdrawal_count_limit_exceeded: {
    message: 'The customer has exceeded the withdrawal count limit.',
    userMessage: 'You\'ve exceeded your withdrawal limit. Please use a different card or try again later.',
    recoverable: false
  }
};

/**
 * Get a user-friendly error message based on Stripe error code and decline code
 * @param {string} stripeErrorCode - The error code from Stripe
 * @param {string} declineCode - The decline code from card issuer
 * @return {string} User-friendly error message
 */
export const getUserFriendlyErrorMessage = (stripeErrorCode, declineCode) => {
  // First check for specific decline code
  if (declineCode && STRIPE_DECLINE_CODES[declineCode]) {
    return STRIPE_DECLINE_CODES[declineCode].userMessage;
  }
  
  // Then check for Stripe error code
  if (stripeErrorCode && STRIPE_ERROR_CODES[stripeErrorCode]) {
    return STRIPE_ERROR_CODES[stripeErrorCode].userMessage;
  }
  
  // Default message if no specific codes match
  return "The payment could not be processed. Please check your payment details and try again.";
};

/**
 * Check if the error is likely recoverable (worth retrying)
 * @param {string} stripeErrorCode - The error code from Stripe
 * @param {string} declineCode - The decline code from card issuer
 * @return {boolean} Whether the error is recoverable
 */
export const isErrorRecoverable = (stripeErrorCode, declineCode) => {
  // First check decline code
  if (declineCode && STRIPE_DECLINE_CODES[declineCode]) {
    return STRIPE_DECLINE_CODES[declineCode].recoverable;
  }
  
  // Some Stripe error codes are generally recoverable
  const recoverableErrorCodes = [
    'processing_error',
    'rate_limit',
    'incomplete_number',
    'incomplete_cvc',
  ];
  
  return recoverableErrorCodes.includes(stripeErrorCode);
};

/**
 * Get developer action recommendation based on error code
 * @param {string} stripeErrorCode - The error code from Stripe
 * @return {string} Developer action recommendation
 */
export const getDeveloperAction = (stripeErrorCode) => {
  if (stripeErrorCode && STRIPE_ERROR_CODES[stripeErrorCode]) {
    return STRIPE_ERROR_CODES[stripeErrorCode].developerAction;
  }
  
  return "Log the complete error details and check the Stripe dashboard for more information.";
};

// Export a helper function to create a full error handling strategy
export const handleStripeError = (error) => {
  const { code, stripeErrorCode, declineCode } = error;
  
  return {
    title: getErrorTitle(code),
    message: getUserFriendlyErrorMessage(stripeErrorCode, declineCode),
    recoverable: isErrorRecoverable(stripeErrorCode, declineCode),
    developerAction: getDeveloperAction(stripeErrorCode),
    diagnosticCode: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
  };
};

/**
 * Get error title based on error code
 */
const getErrorTitle = (code) => {
  switch (code) {
    case 'Failed':
      return 'Payment Failed';
    case 'Canceled':
      return 'Payment Canceled';
    case 'Timeout':
      return 'Payment Timeout';
    case 'NotSupported':
      return 'Payment Method Not Supported';
    default:
      return 'Payment Error';
  }
};

// Export this module for easy import
export default {
  STRIPE_ERROR_CODES,
  STRIPE_DECLINE_CODES,
  getUserFriendlyErrorMessage,
  isErrorRecoverable,
  getDeveloperAction,
  handleStripeError
};