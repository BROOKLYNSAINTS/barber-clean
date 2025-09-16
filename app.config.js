try { require('dotenv').config(); } catch (e) {}
export default {
  name: 'barber-clean',
  slug: 'barber-clean',
  version: '1.0.1',
  ios: {
    buildNumber: '65',
    bundleIdentifier: 'com.ScheduleSync.barber',
    supportsTablet: true,
    infoPlist: { ITSAppUsesNonExemptEncryption: false }
  },
  android: {
    package: 'com.ScheduleSync.barber'
  },
  extra: {
    eas: { projectId: '34c586b7-af2c-411d-9fbd-5cb699e2b12e' }
  },
  plugins: [
    'expo-asset'
  ]
};
