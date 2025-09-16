#!/bin/bash

echo "=== EAS Build Status Checker ==="
echo "This script will check the status of your most recent EAS build"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Get the latest build status
echo -e "\n=== CHECKING LATEST BUILD STATUS ==="
eas build:list --limit 1 --json | jq .

echo -e "\n=== BUILD LOG ==="
echo "To view the full build log, run: eas build:view"
echo "To cancel the build, run: eas build:cancel"

echo -e "\n=== COMMON ISSUES AND SOLUTIONS ==="
echo "1. Module resolution errors:"
echo "   - Check babel.config.js for proper module-resolver setup"
echo "   - Ensure all imports use correct relative paths"
echo "   - Verify tsconfig.json has proper paths configuration"
echo ""
echo "2. Missing dependencies:"
echo "   - Run 'npx expo install <package-name>' to get the correct version"
echo "   - Check 'expo doctor' for compatibility issues"
echo ""
echo "3. Configuration issues:"
echo "   - Ensure app.config.js is properly formatted"
echo "   - Remove any conflicting app.json file"
echo "   - Make sure eas.json has correct profiles"
echo ""
echo "4. Expo Router issues:"
echo "   - Remove 'expo-router/babel' from babel plugins if using SDK 50+"
echo "   - Make sure all layout files have correct imports"
echo ""

echo -e "\n=== NEXT STEPS ==="
echo "Once the build succeeds, run: eas submit -p ios --latest"
echo "This will submit your build to TestFlight"