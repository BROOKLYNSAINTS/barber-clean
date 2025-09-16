#!/bin/bash

# Fix TypeScript Build Issues Script
echo "Starting TypeScript build issues fix script..."

# 1. Create a special build directory for our process
BUILD_DIR="./eas-build-fixed"
mkdir -p $BUILD_DIR

# 2. Install necessary packages for TypeScript handling
echo "Installing TypeScript dependencies..."
npm install --save-dev react-native-typescript-transformer ts-node @types/react @types/react-native

# 3. Create a special TypeScript registration module
echo "Creating TypeScript registration module..."
cat > $BUILD_DIR/register.js << 'EOF'
// This file ensures TypeScript files can be processed
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    jsx: "react",
    module: "commonjs",
    target: "es2017",
    allowJs: true,
    esModuleInterop: true,
    skipLibCheck: true
  }
});

// Register TypeScript extension handler
require.extensions['.ts'] = require.extensions['.js'];
require.extensions['.tsx'] = require.extensions['.js'];

console.log('TypeScript registration complete');
EOF

# 4. Update our minimal config to be used for the build
echo "Creating minimal build configuration..."
cat > $BUILD_DIR/app.config.build.js << 'EOF'
// Minimal configuration that should work for builds
module.exports = {
  name: "barber-clean",
  slug: "barber-clean",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/icon-512.png",
  userInterfaceStyle: "light",
  scheme: "barberscheduler",
  assetBundlePatterns: ["**/*"],
  ios: {
    buildNumber: "62",
    bundleIdentifier: "com.ScheduleSync.barber",
    supportsTablet: true,
    jsEngine: "hermes"
  },
  plugins: ["expo-router"]
};
EOF

# 5. Create a build wrapper script to use our TypeScript registration
echo "Creating build wrapper script..."
cat > $BUILD_DIR/build-wrapper.js << 'EOF'
// Register TypeScript handler
require('./register');

// Run the actual build process
require('@expo/cli').run(['build', '--platform', 'ios', '--profile', 'preview', '--non-interactive']);
EOF

# 6. Create a new tsconfig.json that should work
echo "Creating optimal TypeScript configuration..."
cat > tsconfig.json << 'EOF'
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": false,
    "allowJs": true,
    "esModuleInterop": true,
    "jsx": "react-native",
    "lib": ["DOM", "ESNext"],
    "moduleResolution": "node",
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "target": "ESNext",
    "allowSyntheticDefaultImports": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx"
  ],
  "exclude": [
    "node_modules",
    "babel.config.js",
    "metro.config.js"
  ]
}
EOF

# 7. Prepare the build command
echo "Setting up build environment..."
export APP_CONFIG=$BUILD_DIR/app.config.build.js
export NODE_OPTIONS="--require $BUILD_DIR/register.js"

# 8. Clear metro cache
echo "Clearing Metro cache..."
rm -rf $TMPDIR/metro-*

echo "Build environment prepared!"
echo "Ready to run: EAS_BUILD_CONFIG_FILE=$BUILD_DIR/app.config.build.js eas build --platform ios --profile preview"
echo ""
echo "To run the build with TypeScript fixes, execute:"
echo "EAS_BUILD_CONFIG_FILE=$BUILD_DIR/app.config.build.js NODE_OPTIONS=\"--require $BUILD_DIR/register.js\" eas build --platform ios --profile preview"