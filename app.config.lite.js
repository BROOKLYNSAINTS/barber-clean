// app.config.lite.js - Ultra minimal configuration for build debugging
export default {
  name: 'barber-clean',
  slug: 'barber-clean',
  version: '1.0.1',
  orientation: 'portrait',
  icon: './assets/icon-512.png',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],
  ios: {
    buildNumber: '61',
    bundleIdentifier: 'com.ScheduleSync.barber',
    supportsTablet: true,
    jsEngine: "hermes"
  },
  extra: {
    isTestFlight: true,
    buildType: 'preview'
  },
  plugins: [
    "expo-router"
  ]
};