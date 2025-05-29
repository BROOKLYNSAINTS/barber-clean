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
      buildNumber: '2',
      infoPlist: {
        NSAppTransportSecurity: {
          NSExceptionMinimumTLSVersion: 'TLSv1.0',
          NSAllowsArbitraryLoads: true,
          NSAllowsLocalNetworking: true
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
    plugins: [
      'expo-notifications',
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static'
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: '34c586b7-af2c-411d-9fbd-5cb699e2b12e',
      }
    }
  }
};
