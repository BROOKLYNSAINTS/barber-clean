// sync-firestore-indexes.js
// Updated script to deploy existing indexes to production using Firebase CLI
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to the firestore indexes file
const firestoreIndexesPath = path.join(__dirname, 'firestore-indexes.json');

// Firebase project IDs
const DEV_PROJECT_ID = 'barber-38b88';
const PROD_PROJECT_ID = 'barberapp-prod-2d197';

// Function to check if Firebase CLI is installed
function checkFirebaseCliInstalled() {
  return new Promise((resolve, reject) => {
    exec('firebase --version', (error, stdout, stderr) => {
      if (error) {
        reject(new Error('Firebase CLI is not installed. Please run "npm install -g firebase-tools" to install it.'));
        return;
      }
      console.log(`✅ Firebase CLI detected: ${stdout.trim()}`);
      resolve();
    });
  });
}

// Function to check if user is logged in to Firebase
function checkFirebaseLogin() {
  return new Promise((resolve, reject) => {
    exec('firebase projects:list', (error, stdout, stderr) => {
      if (error || stderr.includes('Error:')) {
        reject(new Error('Not logged in to Firebase. Please run "firebase login" first.'));
        return;
      }
      console.log('✅ Firebase login verified');
      resolve();
    });
  });
}

// Function to verify that we have access to both projects
function verifyProjectAccess() {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Verifying access to Firebase projects...`);
    
    exec('firebase projects:list', (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Failed to list Firebase projects: ${error.message}`));
        return;
      }
      
      // Check if both projects are in the list
      const hasDevProject = stdout.includes(DEV_PROJECT_ID);
      const hasProdProject = stdout.includes(PROD_PROJECT_ID);
      
      if (!hasDevProject) {
        reject(new Error(`Development project ${DEV_PROJECT_ID} not found in your Firebase account.`));
        return;
      }
      
      if (!hasProdProject) {
        reject(new Error(`Production project ${PROD_PROJECT_ID} not found in your Firebase account.`));
        return;
      }
      
      console.log(`✅ Access verified for both Firebase projects:`);
      console.log(`   - Development: ${DEV_PROJECT_ID}`);
      console.log(`   - Production: ${PROD_PROJECT_ID}`);
      resolve();
    });
  });
}

// Function to deploy Firestore indexes to production
function deployIndexesToProduction() {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Deploying Firestore indexes to production (${PROD_PROJECT_ID})...`);
    
    // Create a temporary firebase.json for production deployment
    const tempFirebaseConfig = {
      "firestore": {
        "indexes": "firestore-indexes.json",
        "rules": "firestore.rules"
      }
    };
    
    // Write temporary firebase.json
    fs.writeFileSync('firebase.prod.json', JSON.stringify(tempFirebaseConfig, null, 2));
    
    // Deploy only Firestore indexes to production project
    exec(`firebase deploy --only firestore:indexes --project=${PROD_PROJECT_ID} --config=firebase.prod.json`, 
      (error, stdout, stderr) => {
        // Clean up temporary file
        try {
          fs.unlinkSync('firebase.prod.json');
        } catch (cleanupError) {
          console.warn(`Warning: Failed to clean up temporary file: ${cleanupError.message}`);
        }
        
        if (error) {
          reject(new Error(`Failed to deploy Firestore indexes to production: ${error.message}`));
          return;
        }
        
        if (stderr && !stderr.includes('i  firestore:')) {
          console.warn(`Warning during deployment: ${stderr}`);
        }
        
        console.log(`✅ Successfully deployed Firestore indexes to production project!`);
        console.log(stdout);
        resolve();
      }
    );
  });
}

// Function to analyze indexes file
function analyzeIndexes() {
  try {
    const indexesContent = fs.readFileSync(firestoreIndexesPath, 'utf8');
    const indexesJson = JSON.parse(indexesContent);
    const indexCount = indexesJson.indexes ? indexesJson.indexes.length : 0;
    
    console.log(`\n📊 Found ${indexCount} Firestore indexes in configuration file`);
    
    if (indexCount > 0 && Array.isArray(indexesJson.indexes)) {
      // Group indexes by collection
      const collectionGroups = {};
      indexesJson.indexes.forEach(index => {
        const collection = index.collectionGroup;
        if (!collectionGroups[collection]) {
          collectionGroups[collection] = [];
        }
        collectionGroups[collection].push(index);
      });
      
      console.log(`\nIndex summary by collection:`);
      for (const [collection, indexes] of Object.entries(collectionGroups)) {
        console.log(`  - ${collection}: ${indexes.length} indexes`);
        
        // Show a sample of the fields indexed for each collection
        if (indexes.length > 0) {
          const sampleIndex = indexes[0];
          const fieldsList = sampleIndex.fields.map(f => `${f.fieldPath} (${f.order})`).join(', ');
          console.log(`    Sample: ${fieldsList}`);
        }
      }
    }
    
    return indexCount;
  } catch (error) {
    console.error(`Error analyzing indexes: ${error.message}`);
    return 0;
  }
}

// Main function
async function syncIndexes() {
  try {
    console.log(`\n🔄 FIRESTORE INDEXES SYNCHRONIZATION`);
    console.log(`===================================`);
    console.log(`This script will sync your Firestore indexes from development to production database.`);
    console.log(`Development project: ${DEV_PROJECT_ID}`);
    console.log(`Production project: ${PROD_PROJECT_ID}`);
    
    // Check if indexes file exists
    if (!fs.existsSync(firestoreIndexesPath)) {
      throw new Error(`Firestore indexes file not found at ${firestoreIndexesPath}`);
    }
    
    // Analyze the indexes file
    const indexCount = analyzeIndexes();
    if (indexCount === 0) {
      throw new Error('No indexes found in the configuration file');
    }
    
    // Prerequisite checks
    await checkFirebaseCliInstalled();
    await checkFirebaseLogin();
    await verifyProjectAccess();
    
    // Ask for confirmation
    rl.question('\n⚠️  This will deploy all indexes to the PRODUCTION Firebase project.\n   Are you sure you want to continue? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('❌ Operation cancelled by user');
        rl.close();
        return;
      }
      
      try {
        // Deploy indexes to production
        await deployIndexesToProduction();
        console.log(`\n✅ Firestore indexes have been successfully synchronized from development to production!`);
      } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
      } finally {
        rl.close();
      }
    });
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    rl.close();
  }
}

// Handle readline close
rl.on('close', () => {
  console.log('\n👋 Script execution completed');
});

// Run the main function
syncIndexes();