// app.config.build.js - JavaScript-only version for building
module.exports = {
  name: "barber-clean",
  slug: "barber-clean",
  version: "1.0.1",
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
    buildNumber: "65",
    bundleIdentifier: "com.ScheduleSync.barber",
    supportsTablet: true,
    jsEngine: "hermes",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ["remote-notification"]
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
    "expo-splash-screen",
    "expo-router"
  ],
  web: {
    bundler: "metro"
  },
  extra: {
    isTestFlight: true,
    buildType: "preview",
    eas: {
      projectId: "34c586b7-af2c-411d-9fbd-5cb699e2b12e"
    }
  }
};