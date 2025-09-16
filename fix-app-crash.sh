#!/bin/bash

echo "=== FIXING APP CRASH AND PREPARING NEW BUILD ==="

# Step 1: Apply fixes
echo "📱 Applying fixes for keychain access issues..."

# Replace AuthContext.js with the new version
if [ -f "src/contexts/AuthContext.js.new" ]; then
  cp src/contexts/AuthContext.js.new src/contexts/AuthContext.js
  echo "✅ Updated AuthContext with crash fixes"
fi

# Step 2: Test fixes locally
echo "🧪 To test these fixes locally, run:"
echo "   expo start --clear"
echo "   Then test authentication in the app"

# Step 3: Build for TestFlight
echo ""
echo "🚀 To create a new TestFlight build:"
echo "   eas build --platform ios --profile preview"
echo ""
echo "📲 After the build completes, submit to TestFlight:"
echo "   eas submit -p ios --latest"
echo ""

echo "=== FIX SUMMARY ==="
echo "1. Added keychain-access-groups entitlement"
echo "2. Updated app.config.js to include keychain entitlements"
echo "3. Created Firebase auth fix to use AsyncStorage instead of Keychain"
echo "4. Enhanced AuthContext with error handling and automatic fix"
echo "5. Increased build number from 60 to 61"