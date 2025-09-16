// scripts/verifyFirebaseConfig.js
const fs = require('fs');
const path = require('path');

function checkFirebaseConfig() {
  console.log('🔍 Verifying Firebase configuration files...');
  
  const iosConfigPath = path.resolve(__dirname, '../ios/barberclean/GoogleService-Info.plist');
  const androidConfigPath = path.resolve(__dirname, '../android/app/google-services.json');
  
  if (fs.existsSync(iosConfigPath)) {
    console.log('✅ iOS Firebase config found');
    
    // Basic validation check - ensure it's a valid plist with Firebase content
    const configContent = fs.readFileSync(iosConfigPath, 'utf8');
    if (!configContent.includes('API_KEY') || !configContent.includes('BUNDLE_ID')) {
      console.error('⚠️ GoogleService-Info.plist may be invalid or incomplete');
      console.error('Please verify that it contains valid Firebase configuration');
    }
  } else {
    console.error('❌ Missing iOS Firebase config: GoogleService-Info.plist');
    console.error('Please download from Firebase Console and place in ios/barberclean/');
    console.error('');
    console.error('Follow these steps:');
    console.error('1. Log into Firebase Console (https://console.firebase.google.com/)');
    console.error('2. Select your project (barber-38b88)');
    console.error('3. Click the gear icon > Project settings > Your apps');
    console.error('4. Select the iOS app (com.ScheduleSync.barber)');
    console.error('   - If no iOS app exists, add a new iOS app with this bundle ID');
    console.error('5. Download the GoogleService-Info.plist file');
    console.error('6. Place it in ios/barberclean/ directory');
    console.error('');
    process.exit(1);
  }
  
  if (fs.existsSync(androidConfigPath)) {
    console.log('✅ Android Firebase config found');
    
    // Basic validation check
    try {
      const androidConfig = JSON.parse(fs.readFileSync(androidConfigPath, 'utf8'));
      if (!androidConfig.client || androidConfig.client.length === 0) {
        console.warn('⚠️ google-services.json may be invalid or incomplete');
      }
    } catch (e) {
      console.warn('⚠️ Could not validate google-services.json format');
    }
  } else {
    console.warn('⚠️ Missing Android Firebase config: google-services.json');
    console.warn('This is only required if building for Android');
  }
  
  // Check for potential API key issues
  try {
    const firebaseConfigPath = path.resolve(__dirname, '../src/services/nativeFirebaseConfig.js');
    if (fs.existsSync(firebaseConfigPath)) {
      const configContent = fs.readFileSync(firebaseConfigPath, 'utf8');
      
      // Very basic check - could be improved to actually parse the JS
      if (!configContent.includes('apiKey') || !configContent.includes('appId')) {
        console.warn('⚠️ Firebase config JS file may be missing critical fields');
      }
    } else {
      console.warn('⚠️ Could not find nativeFirebaseConfig.js to validate');
    }
  } catch (e) {
    console.warn('⚠️ Error checking Firebase JS config', e.message);
  }
  
  console.log('✅ Firebase configuration verification completed');
}

checkFirebaseConfig();
