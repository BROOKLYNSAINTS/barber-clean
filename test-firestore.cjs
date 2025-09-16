// test-firestore.cjs - Test Firestore rules and permissions
require('dotenv').config();

// Firebase imports
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  getDoc,
  setDoc,
  collection,
  getDocs
} = require('firebase/firestore');

// Directly use config from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_DEV_API_KEY,
  authDomain: process.env.FIREBASE_DEV_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_DEV_PROJECT_ID,
  storageBucket: process.env.FIREBASE_DEV_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_DEV_APP_ID
};

process.stdout.write('🔥 Initializing Firebase...\n');
process.stdout.write(`Using project: ${firebaseConfig.projectId}\n`);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirestoreRules() {
  process.stdout.write('\n🔒 Testing Firestore Security Rules\n');
  process.stdout.write('-----------------------------------\n');

  try {
    // 1. Test reading a user document
    process.stdout.write('1️⃣ Attempting to read public collections...\n');
    
    // Try reading users collection
    const usersRef = collection(db, 'users');
    try {
      process.stdout.write('   Reading users collection... ');
      const querySnapshot = await getDocs(usersRef);
      const count = querySnapshot.size;
      process.stdout.write(`✅ Success! Found ${count} users\n`);
    } catch (error) {
      process.stdout.write(`❌ Failed: ${error.message}\n`);
    }
    
    // Try reading bulletins (which should be public)
    const bulletinsRef = collection(db, 'bulletins');
    try {
      process.stdout.write('   Reading bulletins collection... ');
      const querySnapshot = await getDocs(bulletinsRef);
      const count = querySnapshot.size;
      process.stdout.write(`✅ Success! Found ${count} bulletin posts\n`);
    } catch (error) {
      process.stdout.write(`❌ Failed: ${error.message}\n`);
    }

    process.stdout.write('\n📝 Test Summary:\n');
    process.stdout.write('   If both tests above succeeded, your Firestore security rules are\n');
    process.stdout.write('   correctly configured for reading public collections.\n');
    process.stdout.write('   If they failed, the error messages will help identify permission issues.\n');
    
  } catch (error) {
    process.stdout.write(`\n❌ Test failed with error: ${error.message}\n`);
  }
}

// Run the test
testFirestoreRules();
