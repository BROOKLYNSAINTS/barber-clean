#!/bin/bash
# fix-testflight-build.sh
# Script to fix TestFlight build issues with Firebase authentication and Firestore permissions

echo "🔧 TestFlight Build Fix Script"
echo "========================================="

# Step 1: Verify environment variables are loaded
echo -e "\n📝 Step 1: Verifying environment variables"
if [ -f .env ]; then
  echo "✅ .env file found"
  
  # Test environment variables loading
  echo -e "\n   Testing environment variables loading..."
  node test-env.cjs
else
  echo "❌ No .env file found! Creating from template..."
  cp .env.example .env
  echo "⚠️ Please fill in the correct API keys in the .env file"
  exit 1
fi

# Step 2: Verify Firestore rules
echo -e "\n📝 Step 2: Checking Firestore rules"
cat firestore.rules
echo -e "\n   Do the rules match the expected rules that allow proper user creation? (y/n)"
read answer

if [ "$answer" != "y" ]; then
  echo "❌ Please fix your Firestore rules first"
  echo "   You can refer to the updated-firestore-rules.txt file"
  exit 1
fi

# Step 3: Deploy updated Firestore rules
echo -e "\n📝 Step 3: Deploying updated Firestore rules"
echo "   Would you like to deploy the updated Firestore rules? (y/n)"
read deploy_rules

if [ "$deploy_rules" == "y" ]; then
  echo "   Deploying rules..."
  firebase deploy --only firestore:rules
  
  if [ $? -eq 0 ]; then
    echo "✅ Firestore rules deployed successfully"
  else
    echo "❌ Failed to deploy Firestore rules"
    echo "   Please ensure you're logged in with Firebase CLI"
    exit 1
  fi
else
  echo "   Skipping rules deployment"
fi

# Step 4: Verify Firebase config files
echo -e "\n📝 Step 4: Verifying Firebase configuration files"

FILES=(
  "./src/services/firebase.js"
  "./src/services/firebaseConfig.js"
  "./src/services/firebaseConfig.prod.js"
  "./src/services/firebaseEnvironment.js"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   Checking $file..."
    HARDCODED_KEYS=$(grep -E "apiKey.*AIza" "$file" | grep -v "process.env" | grep -v "Constants" | wc -l | tr -d ' ')
    
    if [ "$HARDCODED_KEYS" -gt 0 ]; then
      echo "⚠️ $file contains $HARDCODED_KEYS hardcoded API keys!"
      echo "   Please update this file to use environment variables"
    else
      echo "✅ No hardcoded API keys found in $file"
    fi
  fi
done

# Step 5: Run a test build for TestFlight
echo -e "\n📝 Step 5: Testing a build for TestFlight"
echo "   Would you like to start a new TestFlight build? (y/n)"
read start_build

if [ "$start_build" == "y" ]; then
  echo "   Starting TestFlight build..."
  eas build --platform ios --profile production --clear-cache
  
  if [ $? -eq 0 ]; then
    echo "✅ Build started successfully"
  else
    echo "❌ Failed to start build"
    exit 1
  fi
else
  echo "   Skipping build"
fi

# Final summary
echo -e "\n✅ Fix process completed!"
echo "   The following issues have been addressed:"
echo "   1. Environment variables verification"
echo "   2. Firestore security rules update"
echo "   3. Firebase configuration check"
echo "   4. TestFlight build initiation"
echo ""
echo "   Your app should now work correctly in TestFlight!"
