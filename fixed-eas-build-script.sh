#!/bin/bash

echo "=== COMPREHENSIVE EAS BUILD FIX ==="
echo "This script will fix common issues causing EAS build failures"

# Update the app.config.js to be extremely minimal
cat << 'EOF' > app.config.js
// Minimal app.config.js for EAS build
module.exports = {
  name: "barber-clean",
  slug: "barber-clean",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/icon-512.png",
  splash: {
    image: "./assets/icon-512.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    buildNumber: "60",
    bundleIdentifier: "com.ScheduleSync.barber",
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  plugins: [
    "expo-router"
  ],
  extra: {
    eas: {
      projectId: "34c586b7-af2c-411d-9fbd-5cb699e2b12e"
    },
    isTestFlight: true
  }
};
EOF

echo "✅ Updated app.config.js with minimal configuration"

# Fix babel.config.js - Remove expo-router/babel plugin as it's deprecated in SDK 50
cat << 'EOF' > babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 'expo-router/babel' is removed as it's deprecated in SDK 50
      'react-native-reanimated/plugin',
      ['module-resolver', {
        root: ['.'],
        alias: {
          '@': './src'
        },
        extensions: [
          '.ios.js',
          '.android.js',
          '.js',
          '.jsx',
          '.json',
          '.tsx',
          '.ts'
        ]
      }]
    ]
  };
};
EOF

echo "✅ Updated babel.config.js - removed deprecated plugin"

# Fix metro.config.js to properly resolve extensions and aliases
cat << 'EOF' > metro.config.js
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for importing from the src directory with @ alias
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname, 'src'),
};

// Ensure all file extensions are handled properly
config.resolver.sourceExts = [
  'js', 
  'jsx', 
  'json', 
  'ts', 
  'tsx',
  'cjs',
  'mjs'
];

module.exports = config;
EOF

echo "✅ Updated metro.config.js with proper resolution settings"

# Create a minimal tsconfig.json with proper path aliases
cat << 'EOF' > tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": false,
    "allowJs": true,
    "jsx": "react-native",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx"
  ],
  "exclude": [
    "node_modules"
  ]
}
EOF

echo "✅ Updated tsconfig.json with proper path aliases"

# Fix all relative imports that might be problematic - use find with -print0 and xargs to handle special characters
echo "🔍 Checking for problematic relative imports..."

# Create fixed barber layout file if it exists
if [ -f "./app/(app)/(barber)/_layout.js" ]; then
  # Read the file
  BARBER_LAYOUT=$(cat "./app/(app)/(barber)/_layout.js")
  
  # Replace the theme import
  BARBER_LAYOUT=$(echo "$BARBER_LAYOUT" | sed 's|from "../src/styles/theme"|from "@/styles/theme"|g')
  BARBER_LAYOUT=$(echo "$BARBER_LAYOUT" | sed 's|from "../../../src/styles/theme"|from "@/styles/theme"|g')
  
  # Write the file back
  echo "$BARBER_LAYOUT" > "./app/(app)/(barber)/_layout.js"
  
  echo "✅ Fixed barber layout theme import"
fi

# Create fixed customer layout file if it exists
if [ -f "./app/(app)/(customer)/_layout.js" ]; then
  # Read the file
  CUSTOMER_LAYOUT=$(cat "./app/(app)/(customer)/_layout.js")
  
  # Replace the theme import
  CUSTOMER_LAYOUT=$(echo "$CUSTOMER_LAYOUT" | sed 's|from "../src/styles/theme"|from "@/styles/theme"|g')
  CUSTOMER_LAYOUT=$(echo "$CUSTOMER_LAYOUT" | sed 's|from "../../../src/styles/theme"|from "@/styles/theme"|g')
  
  # Write the file back
  echo "$CUSTOMER_LAYOUT" > "./app/(app)/(customer)/_layout.js"
  
  echo "✅ Fixed customer layout theme import"
fi

# Update eas.json to have clean settings
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
        "APP_VARIANT": "preview",
        "IS_TEST_FLIGHT": "true"
      },
      "cache": {
        "key": "1"
      }
    }
  }
}
EOF

echo "✅ Updated eas.json with clean settings"

# Create an App.js that just imports expo-router
cat << 'EOF' > App.js
// App.js - Standard Expo Router entry point
import 'expo-router/entry';
EOF

echo "✅ Updated App.js with clean entry point"

# Remove problematic files
if [ -f "app.json" ]; then
  rm -f app.json
  echo "✅ Removed app.json"
else
  echo "✅ app.json not found (good)"
fi

# Update problematic dependencies
echo "📦 Updating problematic dependencies..."
npx expo install react-native-webview@13.13.5 

# Ensure right expo-router version
npx expo install expo-router@5.1.6

echo "✅ Dependencies updated"

# Run expo doctor to check for any other issues
echo "🩺 Running expo doctor to check for any other issues..."
npx expo-doctor

echo "🚀 DONE! Now try running: eas build --platform ios --profile preview"
echo "If you still have issues, consider trying: eas build --platform ios --profile preview --clear-cache"