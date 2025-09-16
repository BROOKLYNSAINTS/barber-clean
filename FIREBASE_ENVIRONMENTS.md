# Firebase Environment Setup

This project uses multiple Firebase environments:

1. **Development/Testing Environment**
   - Project ID: `barber-38b88`
   - Used in: Development builds, Expo Go, simulator builds

2. **Production Environment**
   - Project ID: `barberapp-prod-2d197`
   - Used in: TestFlight builds, App Store builds

## Environment Detection

The app automatically detects which environment to use:
- Development builds use the test environment
- TestFlight and App Store builds use the production environment

## How It Works

1. **firebaseConfigManager.js**
   - Detects the current environment
   - Loads the appropriate Firebase configuration
   - All Firebase service initialization uses this manager

2. **Configuration Files**
   - `firebaseConfig.js` - Test environment configuration
   - `firebaseConfig.prod.js` - Production environment configuration

## Troubleshooting

If you experience authentication issues:

1. **Check which environment is being used:**
   - Look at the console logs for "Firebase Environment: DEVELOPMENT" or "Firebase Environment: PRODUCTION"
   - Verify the Project ID matches the expected environment

2. **If authentication fails in TestFlight:**
   - Make sure you have registered test users in the production Firebase project
   - Check if the production Firebase project has authentication enabled

3. **To force a specific environment for testing:**
   - You can temporarily modify `firebaseConfigManager.js` to always use a specific environment

## For Developers

When adding new Firebase features, always test in both environments to ensure everything works correctly across environments.
