#!/bin/bash

echo "=== CREATING PURE JAVASCRIPT BUILD ==="

# Create minimal app.config.js
cat << 'EOF' > app.config.js
module.exports = {
  name: "barber-clean",
  slug: "barber-clean",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/icon-512.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/icon-512.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    buildNumber: "70",
    bundleIdentifier: "com.ScheduleSync.barber",
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    package: "com.ScheduleSync.barber",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFFFFF"
    }
  },
  plugins: [
    "expo-router"
  ],
  extra: {
    eas: {
      projectId: "34c586b7-af2c-411d-9fbd-5cb699e2b12e"
    }
  }
};
EOF

# Create minimal babel.config.js
cat << 'EOF' > babel.config.js
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

# Create minimal metro.config.js
cat << 'EOF' > metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
module.exports = config;
EOF

# Create minimal eas.json
cat << 'EOF' > eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "env": {
        "APP_VARIANT": "preview"
      }
    }
  }
}
EOF

# Make sure App.js is correct
cat << 'EOF' > App.js
// App.js - Standard Expo Router entry point
import 'expo-router/entry';
EOF

# Create minimal tsconfig.json (stripped down)
cat << 'EOF' > tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": false,
    "allowJs": true
  }
}
EOF

# Remove any app.json if it exists
if [ -f "app.json" ]; then
  rm app.json
  echo "Removed app.json"
fi

echo "=== ENSURING ALL IMPORTS USE RELATIVE PATHS ==="

# Let's convert any potentially problematic @/ imports to relative imports in the src directory
find ./src -name "*.js" -exec sed -i '' 's|from "@/|from "../|g' {} \;
find ./app -name "*.js" -exec sed -i '' 's|from "@/|from "../src/|g' {} \;

echo "=== CONFIGURATION UPDATED ==="
echo "Now run: EXPO_DEBUG=1 eas build --platform ios --profile preview"