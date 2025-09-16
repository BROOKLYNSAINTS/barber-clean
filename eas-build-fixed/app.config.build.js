// Minimal configuration that should work for builds
module.exports = {
  name: "barber-clean",
  slug: "barber-clean",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/icon-512.png",
  userInterfaceStyle: "light",
  scheme: "barberscheduler",
  assetBundlePatterns: ["**/*"],
  ios: {
    buildNumber: "62",
    bundleIdentifier: "com.ScheduleSync.barber",
    supportsTablet: true,
    jsEngine: "hermes"
  },
  plugins: ["expo-router"]
};
