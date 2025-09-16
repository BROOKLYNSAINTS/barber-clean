// Script to start Firebase emulators
const { execSync } = require('child_process');
const path = require('path');

console.log('🔥 Starting Firebase emulators...');
console.log('🔧 Make sure Firebase CLI is installed (npm install -g firebase-tools)');
console.log('🧪 Using development database configuration');

// Force development config first
try {
  execSync('node use-dev-db.js', { stdio: 'inherit' });
  console.log('✅ Development database configuration enforced');
} catch (error) {
  console.error('❌ Failed to enforce development config:', error.message);
  process.exit(1);
}

// Start the emulators
try {
  console.log('🚀 Starting Firebase emulators...');
  execSync('firebase emulators:start', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to start Firebase emulators:', error.message);
  
  // Try to restore the original config
  try {
    execSync('node restore-firebase-config.js', { stdio: 'inherit' });
  } catch (restoreError) {
    console.error('❌ Failed to restore original config:', restoreError.message);
  }
  
  process.exit(1);
}