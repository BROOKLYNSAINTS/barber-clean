#!/bin/bash
# prebuild.sh - Run this before building for TestFlight/Production

echo "=============================================="
echo "🚀 Running Pre-Build checks for TestFlight/Production"
echo "=============================================="

# Run the configuration check
echo "🔍 Checking configuration consistency..."
node prebuild-check.js

# Check if the above command was successful
if [ $? -ne 0 ]; then
  echo "❌ Pre-build checks failed. Please fix the issues before building."
  exit 1
fi

echo "✅ Pre-build checks passed!"
echo "📱 Ready to build for TestFlight/Production"
echo "=============================================="

# Ask if user wants to continue with the build
read -p "Do you want to continue with the EAS build? (y/n): " choice
if [[ "$choice" =~ ^[Yy]$ ]]; then
  echo "🔨 Running EAS build..."
  eas build --platform ios --profile production --clear-cache
else
  echo "Build canceled. You can run the build manually when ready."
fi
