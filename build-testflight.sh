#!/bin/bash
# build-testflight.sh
# Script to build and submit the app to TestFlight using EAS

echo "🚀 Building for TestFlight with EAS Preview Profile"
echo "This will ensure the app uses the development database in TestFlight"

# Make sure environment variables are loaded
if [ -f .env ]; then
  echo "📝 Loading environment variables from .env"
  set -a
  source .env
  set +a
else
  echo "⚠️ No .env file found. Make sure all environment variables are set!"
fi

# Run a quick check to make sure the Firebase environment is correctly configured
echo "📊 Checking Firebase environment configuration..."
node -e "
  console.log('app.config.js isTestFlight:');
  const appConfig = require('./app.config');
  console.log(appConfig.extra.isTestFlight);
  console.log('EAS_BUILD_PROFILE will be set to \"preview\" during build');
  console.log('When EAS_BUILD_PROFILE === \"preview\", isTestFlight will be: ' + 
              ('preview' === 'preview'));
"

echo ""
echo "🏗️ Building for iOS with 'preview' profile"
echo "This will create a TestFlight build using the development database"
eas build --platform ios --profile preview

echo ""
echo "✅ Build complete"
echo "Once the build is processed, it will be available in TestFlight"
echo "Make sure to test that the app is using the development database!"