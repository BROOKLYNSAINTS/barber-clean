
// Script to restore the original Firebase config
const fs = require('fs');
const path = require('path');

// Paths to the files
const configPath = path.join(__dirname, 'src', 'services', 'firebaseConfig.js');
const backupPath = path.join(__dirname, 'src', 'services', 'firebaseConfig.js.bak');

// Check if backup exists
if (fs.existsSync(backupPath)) {
  // Restore from backup
  fs.copyFileSync(backupPath, configPath);
  console.log('✅ Original firebaseConfig.js restored from backup');
} else {
  console.log('❌ Backup file not found. Cannot restore original config.');
}
