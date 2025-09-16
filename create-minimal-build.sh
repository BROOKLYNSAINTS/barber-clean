#!/bin/bash

echo "=== FINAL EAS BUILD FIX ATTEMPT ==="
echo "This script will make an extremely minimal build configuration"

# Find potential problematic files with web-based-payment.js
echo "🔍 Checking for problematic files..."
find ./app -type f -name "web-based-payment.js"

# Create a minimal copy of the project for building
echo "📁 Creating a clean build directory..."
rm -rf ./clean-build
mkdir -p ./clean-build
mkdir -p ./clean-build/app
mkdir -p ./clean-build/assets
mkdir -p ./clean-build/src/styles

# Copy only essential files
cp -r ./assets/*.png ./clean-build/assets/
cp ./App.js ./clean-build/

# Create a minimal app config
cat << 'EOF' > ./clean-build/app.config.js
module.exports = {
  name: "barber-clean-minimal",
  slug: "barber-clean-minimal",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    buildNumber: "1",
    bundleIdentifier: "com.ScheduleSync.barber",
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  plugins: [],
  extra: {
    eas: {
      projectId: "34c586b7-af2c-411d-9fbd-5cb699e2b12e"
    }
  }
};
EOF

# Create a minimal babel config
cat << 'EOF' > ./clean-build/babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin']
  };
};
EOF

# Create a minimal metro config
cat << 'EOF' > ./clean-build/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
module.exports = config;
EOF

# Create a minimal eas.json
cat << 'EOF' > ./clean-build/eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  }
}
EOF

# Create a minimal App.js
cat << 'EOF' > ./clean-build/App.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Barber App - Minimal Build</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
EOF

# Create a minimal package.json
cat << 'EOF' > ./clean-build/package.json
{
  "name": "barber-clean-minimal",
  "version": "1.0.0",
  "main": "./App.js",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "53.0.22",
    "react": "19.0.0",
    "react-native": "0.79.5",
    "react-native-reanimated": "~3.17.4",
    "react-native-safe-area-context": "5.4.0",
    "react-native-screens": "~4.11.1"
  },
  "devDependencies": {
    "@babel/core": "^7.28.4"
  },
  "private": true
}
EOF

echo "✅ Clean build directory created at ./clean-build"
echo ""
echo "NEXT STEPS:"
echo "1. cd clean-build"
echo "2. npm install"
echo "3. eas build --platform ios --profile preview"
echo ""
echo "This will create a minimal build to verify that EAS build is working correctly."
echo "Once that succeeds, you can incrementally add features back to the clean build."