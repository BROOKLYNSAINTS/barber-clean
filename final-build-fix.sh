#!/bin/bash

# Final attempt to fix EAS build issues
echo "Final attempt to fix EAS build issues..."

# 1. Create a super simple app.config.js with just CommonJS
echo "Creating CommonJS-only app.config.js..."
cat > app.config.js << 'EOF'
// CommonJS-only app.config.js
module.exports = {
  name: "Barber",
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
    buildNumber: "66",
    bundleIdentifier: "com.ScheduleSync.barber",
    supportsTablet: true,
    jsEngine: "hermes",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
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

# 2. Create a simple babel.config.js
echo "Creating simplified babel.config.js..."
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

# 3. Create a simple tsconfig.json just to make TypeScript happy
echo "Creating simplified tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": false,
    "allowJs": true
  },
  "include": [
    "**/*.js",
    "**/*.jsx"
  ],
  "exclude": [
    "node_modules"
  ]
}
EOF

# 4. Create a simple metro.config.js
echo "Creating simplified metro.config.js..."
cat > metro.config.js << 'EOF'
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
EOF

# Try running the build directly
echo "Starting EAS build with simplified config..."
eas build --platform ios --profile preview