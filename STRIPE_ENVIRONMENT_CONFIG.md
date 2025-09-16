# Stripe Production Configuration for TestFlight

This document explains how the Barber App handles Stripe payments in different environments.

## How It Works

The app selects Stripe keys based on where it's running:

- **Development builds**: Use Stripe TEST keys for local development and testing
- **TestFlight builds**: Use Stripe PRODUCTION keys (real money transactions)
- **App Store builds**: Use Stripe PRODUCTION keys (real money transactions)

**IMPORTANT**: TestFlight builds use the production Stripe environment and will charge REAL MONEY.

## Configuration Files

### 1. Client-Side Configuration (`src/services/stripeConfig.js`)

This file selects the correct Stripe publishable key based on the environment:

```javascript
// Determine environment
const buildType = Constants.expoConfig?.extra?.buildType || 'development';

// Choose appropriate key - ONLY development uses test key
export const stripeConfig = {
  publishableKey: buildType === 'development' 
    ? "pk_test_..." // Test key for development only
    : "pk_live_...", // Production key for TestFlight and App Store
  // ...other config
};
```

### 2. Backend Stripe Integration (`backend-stripe-template.js`)

The backend always uses production keys:

```javascript
// Initialize Stripe with the production key
const stripe = require('stripe')(STRIPE_SECRET_KEY);

// All requests use the production environment
console.log(`Processing payment in PRODUCTION mode`);
```

### 3. Environment Variables in `app.config.js`

The build environment is determined in `app.config.js`:

```javascript
extra: {
  // Environment flags for proper configuration selection
  isTestFlight: process.env.EAS_BUILD_PROFILE === 'preview',
  buildType: process.env.EAS_BUILD_PROFILE || 'development',
  // ...
}
```

## Environment Detection

- **Development detection**: When running in development mode (local development)
- **TestFlight detection**: Via the EAS build profile (`process.env.EAS_BUILD_PROFILE === 'preview'`)
- **Production detection**: When deployed to App Store

## Production Keys in TestFlight

TestFlight builds use production keys because:

1. The backend server on Vercel is already configured with production keys
2. We need to test the actual production payment flow
3. This enables testing actual payment processing before App Store release

## Important Notes

- **CAUTION**: TestFlight builds will charge REAL MONEY - they use the production Stripe environment
- **Never** store Stripe secret keys in client-side code
- When testing in TestFlight:
  - Use real cards when you intend to make actual charges
  - Be careful about testing payment flows - they will result in real charges
- Always check the app logs to confirm which environment is being used

## Stripe Cards

For testing in **development** (local development only):
- **Test card that succeeds**: `4242 4242 4242 4242`
- **Test card that fails**: `4000 0000 0000 0002`
- **Expiry date**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

For testing in **TestFlight**:
- Use real cards only - **REAL MONEY WILL BE CHARGED**
- TestFlight payments go through the production Stripe account
- Only use this for final verification before App Store release
- Consider using small amounts for testing (e.g., $1.00)