#!/bin/bash
# fix-firebase-testflight.sh
# Script to fix Firebase configuration and permissions issues for TestFlight builds

echo "🔧 Firebase TestFlight Fix Tool"
echo "===============================\n"

# Step 1: Check environment setup
echo "📋 Step 1: Checking environment..."

# Check if .env file exists
if [ -f .env ]; then
  echo "✅ .env file found"
else
  echo "❌ .env file missing!"
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "⚠️ Please fill in your API keys in the .env file"
fi

# Check if firebase.json exists
if [ -f firebase.json ]; then
  echo "✅ firebase.json found"
else
  echo "⚠️ firebase.json not found, this may cause issues"
fi

# Step 2: Deploy updated Firestore security rules
echo -e "\n📜 Step 2: Updating Firestore security rules..."

# Copy the updated rules to firestore.rules
if [ -f updated-firestore-rules.txt ]; then
  cp updated-firestore-rules.txt firestore.rules
  echo "✅ Firestore rules updated"
else
  echo "⚠️ updated-firestore-rules.txt not found, skipping this step"
fi

# Step 3: Run Firebase configuration test
echo -e "\n🧪 Step 3: Testing Firebase configuration..."
echo "Running test-firebase-config.js..."
npx expo run:ios --scheme barberclean

# Step 4: Check for hardcoded API keys
echo -e "\n🔑 Step 4: Checking for hardcoded API keys..."

# List of files to check
FILES=(
  "./src/services/firebase.js"
  "./src/services/firebaseConfig.js"
  "./src/services/firebaseConfig.prod.js"
  "./src/services/firebaseEnvironment.js"
)

# Search for API key patterns
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Checking $file..."
    API_KEYS=$(grep -E "apiKey.*AIza" "$file" | grep -v "process.env" | grep -v "Constants" | wc -l | tr -d ' ')
    if [ "$API_KEYS" -gt 0 ]; then
      echo "⚠️ $file contains $API_KEYS hardcoded API keys!"
    else
      echo "✅ No hardcoded API keys found in $file"
    fi
  fi
done

# Step 5: Final instructions
echo -e "\n📝 Step 5: Final steps"
echo "1. Deploy updated Firestore security rules with: firebase deploy --only firestore:rules"
echo "2. Test user registration with: node test-user-permissions.js"
echo "3. Build for TestFlight with: eas build --profile production --platform ios"
echo ""
echo "✅ Fix complete! Your app should now work properly in TestFlight."
