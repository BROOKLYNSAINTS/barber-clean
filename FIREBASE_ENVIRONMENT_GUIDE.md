# Firebase Environment Setup for TestFlight and Production

## Overview

This app is now configured to use the correct Firebase database for each environment:

1. **Development Build**: Uses test database (`barber-38b88`)
2. **TestFlight Build**: Uses test database (`barber-38b88`)
3. **App Store Build**: Uses production database (`barberapp-prod-2d197`)

## Why This Approach?

Your concern is exactly right - TestFlight builds should use the test database, not the production database. This approach:

1. Keeps your production data clean until you're ready for release
2. Follows proper development practices (separating test from production)
3. Matches other services like Stripe that use sandbox for testing

## How It Works

### Environment Detection

The system detects which environment it's running in:

```javascript
// From firebaseEnvironment.js
const isAppStoreRelease = () => {
  // Development builds always use test database
  if (__DEV__) {
    return false;
  }
  
  // TestFlight detection
  const isTestFlight = Constants?.manifest?.extra?.isTestFlight || ...

  // Only use production when NOT in TestFlight AND NOT in development
  const usesProdDb = !isTestFlight && !isActualTestFlight && !__DEV__ && ...
  
  return usesProdDb;
};
```

### Database Selection Logic

```javascript
export const getFirebaseConfig = () => {
  // Only App Store builds use production database
  if (isAppStoreRelease()) {
    return prodConfig; // Production database
  }
  
  // TestFlight always uses test database
  if (!__DEV__) {
    return devConfig; // Test database
  }
  
  // Development builds use test database (or user selection)
  // ...
};
```

## For Testing

1. **Development**: You can optionally switch to the production database for testing using the Database Selector on the login screen

2. **TestFlight**: Will always use the test database (`barber-38b88`)

3. **App Store**: Will use the production database (`barberapp-prod-2d197`)

## Before Going Live

1. Set up the production database with your real production data
2. Make one final TestFlight build to verify everything works
3. Submit to the App Store - this build will automatically use the production database

## Implementation Details

The implementation uses:
- `app.config.js`: Contains flags to detect TestFlight builds
- `firebaseEnvironment.js`: Manages database selection
- `DatabaseSelector.js`: UI component for switching in development
