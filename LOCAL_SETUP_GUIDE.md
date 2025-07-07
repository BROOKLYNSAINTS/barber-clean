#!/bin/bash

echo "🏪 Barber App - Local Development Setup"
echo "======================================="
echo ""

echo "📝 STEP 1: Set up your Stripe keys"
echo "1. Go to: https://dashboard.stripe.com/test/apikeys"
echo "2. Copy your 'Secret key' (starts with sk_test_)"
echo "3. Edit /Users/josephmurphy/barber-backend/.env"
echo "4. Replace 'sk_test_YOUR_STRIPE_SECRET_KEY_HERE' with your actual key"
echo ""

echo "🔍 STEP 2: Verify your keys are set"
echo "Backend .env should have:"
echo "  STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY"
echo ""
echo "Frontend .env should have:"
echo "  STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY"
echo ""

echo "🚀 STEP 3: Start the backend server"
echo "Run: cd /Users/josephmurphy/barber-backend && npm run dev"
echo ""

echo "📱 STEP 4: Start your React Native app"
echo "Run: cd /Users/josephmurphy/barber-clean && npx expo start"
echo ""

echo "🧪 STEP 5: Test the payment flow"
echo "1. Open your app in the simulator/device"
echo "2. Navigate to an appointment details page"
echo "3. Tap 'Pay for Service' to test the payment flow"
echo "4. Use Stripe test card: 4242 4242 4242 4242"
echo ""

echo "✅ You're all set! Follow the steps above to complete your setup."
