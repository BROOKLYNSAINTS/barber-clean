# Firebase Authentication Fix Plan for TestFlight Builds

## Problem Diagnosis

The app is encountering "auth/api-key not valid" errors in TestFlight builds despite working correctly in development. This indicates a configuration mismatch between development and production environments.

## Root Causes

1. **Missing platform-specific Firebase configuration**: The app is using web Firebase configuration in an iOS native app without the required iOS-specific setup.

2. **Configuration mismatch**: The `firebase.json` has a different App ID (`1:737852188063:ios:8ecc001eee6651e3d849aa`) than what's in the Firebase config code (`1:910680290414:web:606ee1c0e84c32e6bfcc8c`).

3. **Missing GoogleService-Info.plist**: iOS apps using Firebase require this file which contains platform-specific configurations, including the iOS-specific API key.

## Complete Solution

### 1. Get the correct GoogleService-Info.plist

1. Log into the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (barber-38b88)
3. Click the iOS app (com.ScheduleSync.barber)
   - If no iOS app exists, add a new app with your bundle ID
4. Download the `GoogleService-Info.plist` file
5. Place it in your iOS app directory: `/ios/barberclean/GoogleService-Info.plist`

### 2. Update Firebase Configuration to Use Native Setup

Create a new file to handle native Firebase initialization correctly:

```javascript
// src/services/nativeFirebaseConfig.js
import { Platform } from 'react-native';

// For iOS, Firebase will automatically use GoogleService-Info.plist
// For Android, it will use google-services.json
// We only need this config for web or as fallback
export const webFirebaseConfig = {
  apiKey: "AIzaSyD3FFprDwIZwECR5TkYCeOkiCUNGLp6qQM",
  authDomain: "barber-38b88.firebaseapp.com",
  projectId: "barber-38b88",
  storageBucket: "barber-38b88.appspot.com",
  messagingSenderId: "910680290414",
  appId: "1:910680290414:web:606ee1c0e84c32e6bfcc8c",
  measurementId: "G-B6HMP9YK92"
};

/**
 * In production native apps, Firebase should use the GoogleService-Info.plist 
 * or google-services.json automatically. This function provides a fallback
 * for development and web environments.
 */
export const getFirebaseConfig = () => {
  // Use platform-specific config when in native environment
  const isNativeProduction = Platform.OS !== 'web' && !__DEV__;
  
  if (isNativeProduction) {
    console.log('📱 Using native Firebase configuration');
    // Return empty object to let Firebase use native config files
    return {};
  } else {
    console.log('🌐 Using web Firebase configuration');
    // Use web config for development and web
    return webFirebaseConfig;
  }
};
```

### 3. Update Firebase Initialization

Update your firebase.js file to use the correct initialization approach:

```javascript
// Modify the initialization section in src/services/firebase.js

import { getFirebaseConfig } from './nativeFirebaseConfig';

// ...existing imports...

// ✅ Initialize Firebase with production-ready configuration
let app;
try {
  // Get the appropriate config for the current environment
  const productionConfig = getFirebaseConfig();
  
  console.log('⚡ Initializing Firebase with environment-specific config');
  
  // Check if Firebase is already initialized
  if (getApps().length > 0) {
    console.log('📱 Firebase already initialized, using existing app');
    app = getApp();
  } else {
    console.log('🆕 Creating new Firebase app instance');
    app = initializeApp(productionConfig);
  }
  
  console.log('✅ Firebase initialized successfully!');
} catch (error) {
  // ...existing error handling...
}
```

### 4. Ensure Firebase.json Consistency

Update your firebase.json to match the correct Firebase project:

```json
{
  "react-native": {
    "appId": "1:910680290414:ios:CORRECT_IOS_APP_ID",
    "displayName": "barber-clean"
  },
  
  "ios": {
    "bundleIdentifier": "com.ScheduleSync.barber"
  },
  
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

### 5. Verify API Key Restrictions

1. Check if there are API key restrictions in the Firebase Console:
   - Go to Project Settings > API keys
   - Check if the API key has any IP or app restrictions
   - Ensure your app's bundle ID is in the allowed applications list

### 6. Update Prebuild Verification

Add a script to verify the presence of required configuration files:

```javascript
// scripts/verifyFirebaseConfig.js
const fs = require('fs');
const path = require('path');

function checkFirebaseConfig() {
  console.log('🔍 Verifying Firebase configuration files...');
  
  const iosConfigPath = path.resolve(__dirname, '../ios/barberclean/GoogleService-Info.plist');
  const androidConfigPath = path.resolve(__dirname, '../android/app/google-services.json');
  
  if (fs.existsSync(iosConfigPath)) {
    console.log('✅ iOS Firebase config found');
  } else {
    console.error('❌ Missing iOS Firebase config: GoogleService-Info.plist');
    console.error('Please download from Firebase Console and place in ios/barberclean/');
    process.exit(1);
  }
  
  if (fs.existsSync(androidConfigPath)) {
    console.log('✅ Android Firebase config found');
  } else {
    console.warn('⚠️ Missing Android Firebase config: google-services.json');
    console.warn('This is only required if building for Android');
  }
  
  console.log('✅ Firebase configuration verification completed');
}

checkFirebaseConfig();
```

Update your package.json to run this script before building:

```json
{
  "scripts": {
    "prebuild": "node scripts/verifyFirebaseConfig.js",
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios"
  }
}
```

## Implementation Timeline

1. Download GoogleService-Info.plist from Firebase Console
2. Add nativeFirebaseConfig.js implementation
3. Update firebase.js initialization
4. Fix firebase.json configuration
5. Add verification script
6. Test locally with Expo development build
7. Submit new build to TestFlight

## Verification Plan

After implementing these changes, verify the fix by:

1. Building a development client with `eas build --profile development --platform ios`
2. Testing authentication in the development build
3. Creating a TestFlight build with `eas build --profile production --platform ios`
4. Verifying authentication works correctly in TestFlight
