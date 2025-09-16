// Ultra minimalist app.config.js for builds
module.exports = {
  name: "Barber",
  slug: "barber-clean",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/icon-512.png",
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "com.ScheduleSync.barber",
    buildNumber: "63"
  },
  plugins: []  // Remove even expo-router temporarily
};