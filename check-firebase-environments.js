//check-firebase-environments.js
// This script helps verify Firebase environments are properly configured

const fs = require('fs');
const path = require('path');

// Check if service account files exist
const serviceAccountFiles = {
  dev: './credentials/barber-38b88-service-account.json',
  prod: './credentials/barberapp-prod-service-account.json'
};

let serviceAccountStatus = {
  dev: false,
  prod: false
};

// Check if service account files exist
Object.entries(serviceAccountFiles).forEach(([env, filePath]) => {
  try {
    if (fs.existsSync(path.join(__dirname, filePath))) {
      console.log(`✅ ${env.toUpperCase()} service account found: ${filePath}`);
      serviceAccountStatus[env] = true;
    } else {
      console.log(`❌ ${env.toUpperCase()} service account missing: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error checking ${env} service account:`, err);
  }
});

// Check Firebase configuration files
console.log('\n📂 Checking Firebase configuration files...');

// Read the development Firebase config
try {
  const devConfig = require('./src/services/firebaseConfig');
  console.log('✅ Development Firebase config found');
  console.log('   Project ID:', devConfig?.firebaseConfig?.projectId || 'Not found');
} catch (err) {
  console.log('❌ Error loading development Firebase config:', err.message);
}

// Read the production Firebase config
try {
  const prodConfig = require('./src/services/firebaseConfig.prod');
  console.log('✅ Production Firebase config found');
  console.log('   Project ID:', prodConfig?.default?.projectId || 'Not found');
} catch (err) {
  console.log('❌ Error loading production Firebase config:', err.message);
}

// Check app.config.js isTestFlight setting
try {
  const appConfig = fs.readFileSync(path.join(__dirname, 'app.config.js'), 'utf8');
  
  // Check if isTestFlight is correctly configured
  const isTestFlightLine = appConfig.match(/isTestFlight:\s*(.*),/);
  if (isTestFlightLine) {
    console.log('\n🔍 Found isTestFlight configuration:');
    console.log(`   ${isTestFlightLine[0].trim()}`);
    
    if (isTestFlightLine[1].includes('preview')) {
      console.log('✅ isTestFlight correctly configured to detect preview builds');
    } else {
      console.log('⚠️ isTestFlight might not correctly detect preview builds. Should use "process.env.EAS_BUILD_PROFILE === \'preview\'"');
    }
  } else {
    console.log('❌ Could not find isTestFlight configuration in app.config.js');
  }
} catch (err) {
  console.log('❌ Error checking app.config.js:', err.message);
}

// Check Firestore security rules
console.log('\n📝 Checking Firestore security rules...');
try {
  const rules = fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8');
  
  // Check for key security rules
  const hasIsSignedIn = rules.includes('function isSignedIn()');
  const hasIsNewUser = rules.includes('function isNewUser()');
  const hasUserRules = rules.includes('match /users/{uid}');
  
  console.log(`✅ isSignedIn() function: ${hasIsSignedIn ? 'Found' : 'Missing'}`);
  console.log(`✅ isNewUser() function: ${hasIsNewUser ? 'Found' : 'Missing'}`);
  console.log(`✅ User collection rules: ${hasUserRules ? 'Found' : 'Missing'}`);
  
  // Check if isNewUser includes uid check - this was previously an issue
  if (hasIsNewUser && rules.includes('request.resource.data.uid')) {
    console.log('✅ isNewUser() correctly verifies UID');
  } else if (hasIsNewUser) {
    console.log('⚠️ isNewUser() might not correctly verify UID');
  }
  
} catch (err) {
  console.log('❌ Error checking firestore.rules:', err.message);
}

// Summary and recommendations
console.log('\n📋 Firebase Environment Summary:');
console.log('-------------------------------');

if (!serviceAccountStatus.dev || !serviceAccountStatus.prod) {
  console.log('⚠️ Service account files missing. You need service account credentials to sync indexes between environments.');
  console.log('   Get them from the Firebase Console > Project Settings > Service accounts > Generate new private key');
}

console.log('\n🔑 To sync environments:');
console.log('1. Verify firestore.rules are the same across both environments');
console.log('2. Deploy rules to both environments:');
console.log('   firebase deploy --only firestore:rules --project barber-38b88');
console.log('   firebase deploy --only firestore:rules --project barberapp-prod-2d197');
console.log('3. Sync indexes between environments:');
console.log('   firebase firestore:indexes --project barber-38b88 > firestore-indexes.json');
console.log('   firebase firestore:indexes --project barberapp-prod-2d197 firestore-indexes.json');

console.log('\n🔧 To ensure TestFlight builds use development database:');
console.log('1. Verify app.config.js has isTestFlight: process.env.EAS_BUILD_PROFILE === \'preview\'');
console.log('2. Check firebaseEnvironment.js identifies preview builds correctly');
console.log('3. Create a new preview build with:');
console.log('   eas build --platform ios --profile preview');

console.log('\n📱 To test the environment detection:');
console.log('1. Install the TestFlight build on your device');
console.log('2. Check logs to confirm it\'s using the development database (barber-38b88)');
console.log('3. Verify you can log in with development database credentials');