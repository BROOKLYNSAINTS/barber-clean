#!/bin/bash

echo "Starting pure JavaScript build process..."

# Clean up any previous builds
echo "Cleaning up node_modules..."
rm -rf node_modules
npm cache clean --force

# Install dependencies without TypeScript checks
echo "Installing dependencies..."
npm install --no-audit --no-fund

# Clear any Metro cache
echo "Clearing Metro cache..."
rm -rf $TMPDIR/metro-*

# Create a babel.config.js that doesn't try to use TypeScript
echo "Creating simplified babel configuration..."
cat > babel.config.js << 'EOF'
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      'react-native-reanimated/plugin'
    ]
  };
};
EOF

# Run the build with our JavaScript-only configuration
echo "Starting EAS build with JavaScript-only config..."
EAS_BUILD_CONFIG_FILE=app.config.build.js eas build --platform ios --profile preview --non-interactive