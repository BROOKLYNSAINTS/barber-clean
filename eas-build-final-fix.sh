#!/bin/bash

# eas-build-final-fix.sh - Final approach to fix EAS build issues
echo "Starting comprehensive EAS build fix..."

# 1. Clean up node_modules
echo "Cleaning up node_modules..."
rm -rf node_modules
npm cache clean --force

# 2. Create minimal versions of all config files
echo "Creating minimal configuration files..."

# Create app.config.js with CommonJS
echo "- Creating pure CommonJS app.config.js..."
cat > app.config.js << 'EOF'
// Pure CommonJS app config (no TypeScript)
module.exports = {
  name: "barber-clean",
  slug: "barber-clean",
  version: "1.0.2", // Incremented version
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
    buildNumber: "67",
    bundleIdentifier: "com.ScheduleSync.barber",
    supportsTablet: true,
    jsEngine: "hermes",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  plugins: ["expo-splash-screen", "expo-router"],
  extra: {
    isTestFlight: true,
    buildType: "preview",
    eas: {
      projectId: "34c586b7-af2c-411d-9fbd-5cb699e2b12e"
    }
  }
};
EOF

# Create babel.config.js
echo "- Creating babel.config.js..."
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

# Create minimal tsconfig.json
echo "- Creating minimal tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": false,
    "allowJs": true
  }
}
EOF

# Create minimal metro.config.js
echo "- Creating minimal metro.config.js..."
cat > metro.config.js << 'EOF'
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
module.exports = config;
EOF

# 3. Install dependencies with focus on no TypeScript
echo "Installing dependencies (no TypeScript validation)..."
npm install --no-audit --no-fund --no-optional

# 4. Update eas.json to avoid TypeScript
echo "Updating eas.json..."
cat > eas.json << 'EOF'
{
  "cli": {
    "appVersionSource": "local",
    "version": ">= 5.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "env": {
        "ENVIRONMENT": "preview",
        "EXPO_NO_TYPESCRIPT_SETUP": "1",
        "DISABLE_TS_CONFIG": "1"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "ENVIRONMENT": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
EOF

# 5. Run EAS build
echo "Running EAS build..."
eas build --platform ios --profile preview