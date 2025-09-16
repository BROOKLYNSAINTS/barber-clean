#!/bin/bash

# Minimal environment setup for EAS build
echo "Creating minimal environment variables for build..."

# Create a .env file that won't cause issues
cat > .env << 'EOF'
# Minimal .env file for EAS build
FIREBASE_DEV_API_KEY=placeholder
FIREBASE_DEV_AUTH_DOMAIN=placeholder
FIREBASE_DEV_PROJECT_ID=placeholder
FIREBASE_DEV_STORAGE_BUCKET=placeholder
FIREBASE_DEV_MESSAGING_SENDER_ID=placeholder
FIREBASE_DEV_APP_ID=placeholder
FIREBASE_DEV_MEASUREMENT_ID=placeholder

FIREBASE_PROD_API_KEY=placeholder
FIREBASE_PROD_AUTH_DOMAIN=placeholder
FIREBASE_PROD_PROJECT_ID=placeholder
FIREBASE_PROD_STORAGE_BUCKET=placeholder
FIREBASE_PROD_MESSAGING_SENDER_ID=placeholder
FIREBASE_PROD_APP_ID=placeholder
FIREBASE_PROD_MEASUREMENT_ID=placeholder

STRIPE_TEST_PUBLISHABLE_KEY=placeholder
STRIPE_LIVE_PUBLISHABLE_KEY=placeholder
STRIPE_BACKEND_URL=placeholder
MERCHANT_IDENTIFIER=placeholder
URL_SCHEME=placeholder
OPENAI_API_KEY=placeholder
EOF

echo "Created minimal .env file for build"

# Create environment for the next build
echo "Setting up build environment..."
eas build:configure