// app.config.stable.js - Enhanced for stability
// Generated on 2025-09-15T17:02:53.151Z
// Run "expo prebuild --clean" after applying these changes

module.exports = {
  "name": "barber-clean",
  "slug": "barber-clean",
  "version": "1.0.1",
  "orientation": "portrait",
  "icon": "./assets/icon-512.png",
  "splash": {
    "image": "./assets/icon-512.png",
    "resizeMode": "contain",
    "backgroundColor": "#ffffff"
  },
  "assetBundlePatterns": [
    "**/*"
  ],
  "ios": {
    "buildNumber": "61",
    "bundleIdentifier": "com.ScheduleSync.barber",
    "supportsTablet": true,
    "infoPlist": {
      "ITSAppUsesNonExemptEncryption": false,
      "NSCalendarsUsageDescription": "We use calendar access to schedule and manage your barber appointments",
      "NSCalendarsFullAccessUsageDescription": "We use calendar access to schedule and manage your barber appointments",
      "NSCameraUsageDescription": "We need camera access to capture profile pictures and haircut photos",
      "NSPhotoLibraryUsageDescription": "We need photo library access to upload profile pictures and haircut references",
      "NSMicrophoneUsageDescription": "We need microphone access for voice commands and virtual consultations",
      "NSRemindersUsageDescription": "We use reminders to help you remember upcoming barber appointments",
      "NSRemindersFullAccessUsageDescription": "We use reminders to help you remember upcoming barber appointments",
      "NSSpeechRecognitionUsageDescription": "We use speech recognition for voice commands to book and manage appointments",
      "UIBackgroundModes": [
        "fetch",
        "remote-notification"
      ],
      "NSAppTransportSecurity": {
        "NSAllowsArbitraryLoads": true
      },
      "UIApplicationSceneManifest": {
        "UIApplicationSupportsMultipleScenes": false
      },
      "WKAppBoundDomains": [
        "barber-backend-ten.vercel.app"
      ]
    },
    "entitlements": {
      "keychain-access-groups": [
        "$(AppIdentifierPrefix)com.ScheduleSync.barber"
      ]
    },
    "requireFullScreen": false,
    "associatedDomains": [],
    "googleServicesFile": "./GoogleService-Info.plist"
  },
  "plugins": [
    "expo-router",
    "expo-secure-store",
    "expo-application",
    "@react-native-async-storage/async-storage",
    "expo-dev-client"
  ],
  "extra": {
    "eas": {
      "projectId": "34c586b7-af2c-411d-9fbd-5cb699e2b12e"
    },
    "isTestFlight": true,
    "enableComprehensiveFix": true,
    "enableErrorBoundary": true,
    "recoveryTimeoutMs": 5000,
    "useImprovedWebView": true
  },
  "android": {
    "softwareKeyboardLayoutMode": "pan",
    "package": "com.barberapp",
    "adaptiveIcon": {
      "backgroundColor": "#ffffff"
    },
    "googleServicesFile": "./google-services.json"
  },
  "web": {
    "favicon": "./assets/favicon.png"
  },
  "developmentClient": {
    "silentLaunch": false
  },
  "updates": {
    "url": "https://u.expo.dev/your-project-id",
    "enabled": true,
    "checkAutomatically": "ON_LOAD"
  }
};