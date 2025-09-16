// test-simple.js - A simple script to test Firestore rules
const dotenv = require('dotenv');
dotenv.config();

// Load Firebase
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

// Use API key directly from .env
const firebaseConfig = {
  apiKey: process.env.FIREBASE_DEV_API_KEY,
  authDomain: process.env.FIREBASE_DEV_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_DEV_PROJECT_ID,
  storageBucket: process.env.FIREBASE_DEV_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_DEV_APP_ID
};

console.log('Testing with Firebase config:');
console.log('- API Key:', process.env.FIREBASE_DEV_API_KEY ? 'Present' : 'Missing');
console.log('- Project ID:', process.env.FIREBASE_DEV_PROJECT_ID);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test email and password
const testEmail = 'test-firestore@example.com';
const testPassword = 'TestPassword123!';

async function testFirestore() {
  try {
    // Step 1: Create a test user
    console.log('Creating test user...');
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const uid = userCredential.user.uid;
    console.log('Test user created with UID:', uid);
    
    // Step 2: Create a user profile document
    console.log('Creating user profile document...');
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      uid: uid,
      email: testEmail,
      displayName: 'Test User',
      userType: 'customer',
      createdAt: new Date().toISOString()
    });
    console.log('User document created');
    
    // Step 3: Read the user document back
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      console.log('SUCCESS: User document exists with data:', docSnap.data());
    } else {
      console.log('ERROR: User document does not exist after creation');
    }
    
  } catch (error) {
    console.error('TEST FAILED:', error.code, error.message);
  }
}

testFirestore();
