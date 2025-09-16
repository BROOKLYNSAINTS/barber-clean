#!/bin/bash

# Final attempt to fix EAS build with minimal configuration
echo "========================================="
echo "   CREATING MINIMAL BUILD CONFIGURATION  "
echo "========================================="

# 1. Create a super minimal app.config.js
echo "Creating minimal app.config.js..."
cat > app.config.js << 'EOF'
// Minimal app.config.js for EAS build
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
    buildNumber: "69",
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
    isTestFlight: true,
    buildType: "preview",
    eas: {
      projectId: "34c586b7-af2c-411d-9fbd-5cb699e2b12e"
    }
  }
};
EOF

# 2. Create a minimal babel.config.js
echo "Creating minimal babel.config.js..."
cat > babel.config.js << 'EOF'
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      'react-native-reanimated/plugin',
      ['module-resolver', {
        alias: {
          '@': './src'
        }
      }]
    ]
  };
};
EOF

# 3. Create a minimal tsconfig.json
echo "Creating minimal tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": false,
    "allowJs": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
EOF

# 4. Create a minimal metro.config.js
echo "Creating minimal metro.config.js..."
cat > metro.config.js << 'EOF'
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
module.exports = config;
EOF

# 5. Update eas.json to be very simple
echo "Creating minimal eas.json..."
cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  }
}
EOF

# 6. Make sure we don't have app.json
echo "Removing app.json if it exists..."
[ -f app.json ] && mv app.json app.json.bak

# 7. Sync package.json and package-lock.json
echo "Syncing package-lock.json with package.json..."
npm install --package-lock-only

echo "========================================="
echo "   CONFIGURATION COMPLETE                "
echo "========================================="
echo "Now run: eas build --platform ios --profile preview"