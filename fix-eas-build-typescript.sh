#!/bin/bash

echo "Setting up special app config for EAS build..."

# Create a special build.config.js for EAS that avoids TypeScript issues
cat > app.config.js << 'EOF'
module.exports = {
  name: "barber-clean",
  slug: "barber-clean",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/icon-512.png",
  userInterfaceStyle: "light",
  scheme: "barberscheduler",
  splash: {
    image: "./assets/icon-512.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    buildNumber: "65",
    bundleIdentifier: "com.ScheduleSync.barber",
    supportsTablet: true,
    jsEngine: "hermes"
  },
  plugins: [
    "expo-splash-screen",
    "expo-router"
  ],
  extra: {
    isTestFlight: true,
    buildType: "preview",
    eas: {
      projectId: "34c586b7-af2c-411d-9fbd-5cb699e2b12e"
    }
  }
};
EOF

echo "Creating TypeScript support module..."
mkdir -p ./build-support

# Create a module that will handle TypeScript files
cat > ./build-support/ts-support.js << 'EOF'
// Register TypeScript extensions as JavaScript
require.extensions['.ts'] = require.extensions['.js'];
require.extensions['.tsx'] = require.extensions['.js'];
console.log('TypeScript support registered');
EOF

# Add a node script to modify package.json for build
cat > ./build-support/prepare-eas-build.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Read the existing package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Add a preprocess script for TypeScript
packageJson.scripts = packageJson.scripts || {};
packageJson.scripts.prestart = "node ./build-support/ts-support.js";

// Make sure main points to a JS file
packageJson.main = "./App.js";

// Update the package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('Updated package.json for EAS build');
EOF

# Run the package.json update script
node ./build-support/prepare-eas-build.js

# Check if we're using a recent version of node (required for TypeScript)
node_version=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$node_version" -lt 16 ]; then
  echo "Warning: Using Node.js version older than 16. This may cause build issues."
  echo "Current version: $(node -v)"
fi

echo "Build preparation complete. Running EAS build..."
NODE_OPTIONS="--require ./build-support/ts-support.js" eas build --platform ios --profile preview