# How to Fix Firebase Authentication in TestFlight

This guide provides step-by-step instructions to fix the "auth/api-key not valid" error in TestFlight builds.

## Root Cause

The issue is caused by Firebase SDK not using the proper iOS-specific configuration in TestFlight builds. In iOS apps, Firebase should use the `GoogleService-Info.plist` file for configuration rather than the JavaScript config.

## Step 1: Download GoogleService-Info.plist

1. Log into the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (barber-38b88)
3. Click the gear icon (Project Settings) > Project settings
4. Go to the "Your apps" section and select your iOS app
   - If no iOS app exists, add a new app with your bundle ID: `com.ScheduleSync.barber`
5. Download the `GoogleService-Info.plist` file
6. Place it in your iOS app directory: `/ios/barberclean/GoogleService-Info.plist`

## Step 2: Update Your Code

The necessary files have been created to fix the issue:

1. **nativeFirebaseConfig.js**: Implements proper environment detection to use native config
2. **verifyFirebaseConfig.js**: Verifies required config files are present before building
3. **FIREBASE_FIX_PLAN.md**: Contains the full implementation plan

## Step 3: Update Firebase.js

Update your firebase.js file to use the new configuration:

```javascript
// In src/services/firebase.js
// Replace the import line:
import { firebaseConfig } from './firebaseConfig';

// With this:
import { getFirebaseConfig } from './nativeFirebaseConfig';
```

And replace the initialization section:

```javascript
// Replace this:
const productionConfig = firebaseConfig;

// With this:
const productionConfig = getFirebaseConfig();
```

## Step 4: Update Package.json

Add the verify script to run before builds:

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

## Step 5: Build and Test

1. Build a development client:
   ```
   eas build --profile development --platform ios
   ```

2. Test authentication in the development build

3. Create a TestFlight build:
   ```
   eas build --profile production --platform ios
   ```

4. Verify authentication works correctly in TestFlight

## Additional Troubleshooting

If you still encounter issues:

1. Check API key restrictions in Firebase Console
2. Ensure bundle ID in GoogleService-Info.plist matches your app
3. Verify firebase.json has the correct appId that matches your iOS app
