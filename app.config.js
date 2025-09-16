try { require('dotenv').config(); } catch (e) {}
export default {
  name: 'barber-clean',
  slug: 'barber-clean',
  version: '1.0.1',
  ios: {
    buildNumber: '66', // bump for resubmission
    bundleIdentifier: 'com.ScheduleSync.barber',
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: 'We use the camera to let you take or upload profile and shop photos.',
      NSPhotoLibraryUsageDescription: 'We access your photo library so you can choose photos to upload.',
      NSPhotoLibraryAddUsageDescription: 'We save images to your photo library when you choose to export or save.'
    }
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
