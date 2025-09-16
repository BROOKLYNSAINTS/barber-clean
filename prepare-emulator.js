// prepare-emulator.js
// This script modifies Firebase configuration for local emulator testing

console.log('🧪 Preparing Firebase for local emulator testing');

// Update the Firebase connection code to connect to emulators
const fs = require('fs');
const path = require('path');

// Path to the firebase.js file
const firebasePath = path.join(__dirname, 'src', 'services', 'firebase.js');

// Read the current content
const content = fs.readFileSync(firebasePath, 'utf8');

// Check if the emulator setup is already correctly configured
if (content.includes('connectFirestoreEmulator(db, "localhost", 8080)') &&
    content.includes('connectAuthEmulator(auth, "http://localhost:9099")')) {
  console.log('✅ Firebase already configured for emulator use');
  process.exit(0);
}

// Backup the file if a backup doesn't already exist
const backupPath = path.join(__dirname, 'src', 'services', 'firebase.js.bak');
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(firebasePath, backupPath);
  console.log('✅ Created backup of firebase.js');
}

// Ensure emulator connection is correctly set up
let newContent = content;

// Make sure the emulator connection is after auth and db initialization
const emulatorSnippet = `
// Connect to the Firebase emulators
if (__DEV__) {
  console.log('🧪 Connecting to Firebase emulators on localhost');
  connectFirestoreEmulator(db, "localhost", 8080);
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: false });
}
`;

// Look for the pattern where db and auth are initialized
if (content.includes('const db = getFirestore(app);')) {
  // Replace the initialization block with one that includes emulator connection
  newContent = content.replace(
    /const db = getFirestore\(app\);(\s*)const functions = getFunctions\(app\);(\s*)/,
    `const db = getFirestore(app);\n\nconst functions = getFunctions(app);\n${emulatorSnippet}\n`
  );
} else {
  console.error('❌ Could not find db initialization in firebase.js');
  process.exit(1);
}

// Write the updated file
fs.writeFileSync(firebasePath, newContent);
console.log('✅ Updated firebase.js to use emulators');

// Create a restore script
const restoreScript = `
// restore-firebase.js
// Restores the original firebase.js file

const fs = require('fs');
const path = require('path');

const firebasePath = path.join(__dirname, 'src', 'services', 'firebase.js');
const backupPath = path.join(__dirname, 'src', 'services', 'firebase.js.bak');

if (fs.existsSync(backupPath)) {
  fs.copyFileSync(backupPath, firebasePath);
  console.log('✅ Restored original firebase.js file');
} else {
  console.log('❌ No backup file found');
}
`;

fs.writeFileSync(path.join(__dirname, 'restore-firebase.js'), restoreScript);
console.log('✅ Created restore script');

console.log('\n🧪 Firebase is now configured for emulator use.');
console.log('   Start emulators with: firebase emulators:start');
console.log('   To restore original files, run: node restore-firebase.js');