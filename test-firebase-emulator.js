// Script to start emulators and run tests
const { execSync, spawn } = require('child_process');
const fs = require('fs');

console.log('🔥 Starting Firebase emulators and running tests');

// Run the use-dev-db.js script first
console.log('🔧 Setting up development environment...');
try {
  execSync('node use-dev-db.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to set up development environment:', error.message);
  process.exit(1);
}

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Firebase CLI not found. Please install it with: npm install -g firebase-tools');
  process.exit(1);
}

// Start the Firebase emulators in a separate process
console.log('🚀 Starting Firebase emulators...');
const emulatorProcess = spawn('firebase', ['emulators:start'], {
  detached: false,
  stdio: 'inherit'
});

// Give emulators time to start
console.log('⏱️ Waiting for emulators to start...');
setTimeout(() => {
  console.log('\n🧪 Running Firestore rules tests...');
  try {
    execSync('node test-firestore-rules.js', { stdio: 'inherit' });
    console.log('\n✅ Tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
  }
  
  console.log('\n⚠️ Firebase emulators are still running. Press Ctrl+C to stop them when done.');
}, 5000); // Wait 5 seconds for emulators to start

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping emulators and cleaning up...');
  emulatorProcess.kill();
  
  // Restore original Firebase config
  try {
    if (fs.existsSync('./src/services/firebaseConfig.js.bak')) {
      execSync('node restore-firebase-config.js', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error('❌ Failed to restore original config:', error.message);
  }
  
  process.exit(0);
});