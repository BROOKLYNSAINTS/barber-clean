# Build Troubleshooting Guide

Based on the error in your EAS build, I've identified some potential issues and created fixes.

## Common Issues That Cause Build Failures

1. **TypeScript Configuration Issues**: When the TypeScript config doesn't match your project structure
2. **Environment Variables**: Missing or improperly formatted environment variables
3. **Plugins Configuration**: Incorrect plugin setup in app.config.js
4. **Node Version Incompatibilities**: Different Node.js versions between local and build environment
5. **Dependency Conflicts**: Incompatible package versions

## Fix #1: Use Simplified Config

```bash
# Run build with simplified config
EAS_BUILD_CONFIG_FILE=app.config.simple.js eas build --platform ios --profile preview
```

This uses the stripped-down `app.config.simple.js` file I created that removes complex plugin configurations.

## Fix #2: Ultra-Minimal Config

If Fix #1 doesn't work, try the ultra-minimal config:

```bash
EAS_BUILD_CONFIG_FILE=app.config.lite.js eas build --platform ios --profile preview
```

This uses `app.config.lite.js` which has only the absolute bare minimum needed for a build.

## Fix #3: Full Reset and Build

I've created a script that performs a comprehensive reset and build:

```bash
./fix-eas-build.sh
```

This script:
1. Removes node_modules
2. Uses Node 20 for compatibility
3. Reinstalls dependencies
4. Creates a minimal TypeScript config
5. Clears Metro cache
6. Runs the build with the simple config

## Fix #4: Bypass TypeScript Checks

If you suspect TypeScript issues are causing the build failure:

1. Update your `tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": false,
    "allowJs": true,
    "checkJs": false,
    "skipLibCheck": true
  }
}
```

2. Run build with TS checks disabled:
```bash
EAS_NO_TYPECHECK=1 EAS_BUILD_CONFIG_FILE=app.config.simple.js eas build --platform ios --profile preview
```

## Fix #5: Use Local Build

If EAS cloud builds continue to fail, try building locally:

```bash
# Install eas-cli globally if you haven't already
npm install -g eas-cli

# Run local build
eas build --platform ios --profile preview --local
```

This builds on your local machine where development already works.

## Analyzing Build Logs

When you get build errors, look for these key sections in the logs:

1. **Environment setup errors**: Near the beginning of the logs
2. **Dependency installation errors**: Look for npm/yarn errors
3. **TypeScript compilation errors**: Search for "error TS"
4. **Metro bundling errors**: Search for "Failed to build"
5. **Native code errors**: Look for Xcode build errors near the end

## Getting Support

If none of these solutions work, collect:

1. Complete build logs (from EAS dashboard)
2. Your package.json dependencies list
3. Your app.config.js configuration
4. Any modifications you've made to native code

Then reach out to Expo support with these details.