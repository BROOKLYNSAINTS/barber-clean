export default {
  expo: {
    name: 'barber-clean',
    slug: 'barber-clean',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      bundleIdentifier: "com.ScheduleSync.barber",
      supportsTablet: true,
      useFrameworks: 'static',
      infoPlist: {
        NSCalendarsUsageDescription: "This app needs access to your calendar.",
        NSRemindersUsageDescription: "This app needs access to your reminders.",
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        }
      }
    },
    android: {
      package: 'com.schedulesync.barber',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-notifications',
      'expo-build-properties'
    ],
    extra: {
      eas: {
        projectId: '34c586b7-af2c-411d-9fbd-5cb699e2b12e',
      }
    }
  }
};
