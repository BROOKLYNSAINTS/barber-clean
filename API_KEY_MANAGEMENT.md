# Secure API Key Management

## Overview

This document outlines how API keys and sensitive credentials are managed securely in the barber-clean project.

## Environment Variables

All sensitive API keys and configuration values are stored in environment variables using a `.env` file, which is **not** committed to the repository (it's listed in .gitignore).

### Key Files

1. `.env` - Contains all sensitive API keys and configuration values
2. `.env.example` - A template file showing which variables need to be set (without actual values)

### Current Environment Variables

The following environment variables are used in the project:

```
# Firebase Development Environment
FIREBASE_DEV_API_KEY=...
FIREBASE_DEV_AUTH_DOMAIN=...
FIREBASE_DEV_PROJECT_ID=...
FIREBASE_DEV_STORAGE_BUCKET=...
FIREBASE_DEV_MESSAGING_SENDER_ID=...
FIREBASE_DEV_APP_ID=...
FIREBASE_DEV_MEASUREMENT_ID=...

# Firebase Production Environment
FIREBASE_PROD_API_KEY=...
FIREBASE_PROD_AUTH_DOMAIN=...
FIREBASE_PROD_PROJECT_ID=...
FIREBASE_PROD_STORAGE_BUCKET=...
FIREBASE_PROD_MESSAGING_SENDER_ID=...
FIREBASE_PROD_APP_ID=...
FIREBASE_PROD_MEASUREMENT_ID=...

# Stripe Configuration
STRIPE_TEST_PUBLISHABLE_KEY=...
STRIPE_LIVE_PUBLISHABLE_KEY=...
STRIPE_BACKEND_URL=...
MERCHANT_IDENTIFIER=...
URL_SCHEME=...

# OpenAI Configuration
OPENAI_API_KEY=...
```

## How It Works

1. Environment variables from `.env` are loaded using dotenv
2. `app.config.js` exposes these variables to the Expo app via the `extra` object
3. Configuration files like `stripeConfig.js` read these values from `Constants.expoConfig.extra`

## Security Considerations

- **Never hardcode API keys** directly in source code
- **Never commit the `.env` file** to version control
- For CI/CD pipelines, set environment variables in your build system
- For EAS builds, use EAS secrets to manage environment variables

## Setup for New Developers

1. Copy `.env.example` to a new file named `.env`
2. Fill in the required API keys and configuration values
3. Run the app - it will now use your environment variables

## Vercel Backend

For the Vercel backend deployment, environment variables should be set in the Vercel project settings rather than in the code repository.
