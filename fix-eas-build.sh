#!/bin/bash

# Clean up any previous builds
rm -rf node_modules

# Install dependencies with specific Node version
nvm use 20 || nvm install 20
npm install

# Fix potential TypeScript issues
echo "// tsconfig.json - minimal setup" > tsconfig.json
echo '{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "allowJs": true,
    "esModuleInterop": true,
    "jsx": "react-native",
    "lib": ["DOM", "ESNext"],
    "moduleResolution": "node",
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "target": "ESNext"
  },
  "exclude": [
    "node_modules",
    "babel.config.js",
    "metro.config.js",
    "jest.config.js"
  ]
}' > tsconfig.json

# Clean Metro cache
rm -rf $TMPDIR/metro-bundler-cache-*

# Run the build with simplified config
EAS_BUILD_CONFIG_FILE=app.config.simple.js eas build --platform ios --profile preview --non-interactive
