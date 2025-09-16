// test-user-permissions.js
// Script to test and fix user permissions issues with Firestore
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  deleteUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from './src/services/firebaseEnvironment.js';

// Initialize Firebase with the environment-aware config
console.log('🔥 Initializing Firebase with config:');
console.log('- API Key exists:', !!firebaseConfig.apiKey);
console.log('- Project ID:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test user credentials - REPLACE THESE with your own test credentials
const TEST_EMAIL = 'test-permissions@example.com';
const TEST_PASSWORD = 'TestPassword123!';

// Function to test user creation and document permissions
const testUserPermissions = async () => {
  try {
    console.log('\n🧪 Testing User Permissions\n');
    console.log('This test will:');
    console.log('1. Create a test user account');
    console.log('2. Try to create a user profile document');
    console.log('3. Clean up by deleting the test user');
    
    // Step 1: Create a new test user
    console.log('\n👤 Step 1: Creating test user...');
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      console.log('✅ Test user created successfully with UID:', userCredential.user.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        // User already exists, try to sign in
        console.log('⚠️ User already exists, signing in...');
        userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
        console.log('✅ Signed in as existing user with UID:', userCredential.user.uid);
      } else {
        throw error;
      }
    }
    
    const userId = userCredential.user.uid;
    
    // Step 2: Create a user profile document
    console.log('\n📄 Step 2: Creating user profile document...');
    try {
      const userDocRef = doc(db, 'users', userId);
      
      // Try to get existing document first
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        console.log('ℹ️ User document already exists');
      } else {
        // Create the user document
        const profileData = {
          uid: userId,
          email: TEST_EMAIL,
          displayName: 'Test User',
          userType: 'customer',
          createdAt: new Date().toISOString()
        };
        
        await setDoc(userDocRef, profileData);
        console.log('✅ User profile document created successfully');
      }
      
      // Verify document was created
      const verifyDoc = await getDoc(userDocRef);
      if (verifyDoc.exists()) {
        console.log('✅ Verified: User document exists');
        console.log('📄 Document data:', verifyDoc.data());
      } else {
        console.log('❌ ERROR: User document does not exist after creation attempt');
      }
    } catch (error) {
      console.error('❌ Error creating user profile document:', error);
      console.log('⚠️ This likely indicates a permissions issue with your Firestore rules');
    }
    
    // Step 3: Clean up by deleting the test user
    console.log('\n🧹 Step 3: Cleaning up...');
    try {
      // Delete the user document
      await deleteDoc(doc(db, 'users', userId));
      console.log('✅ User document deleted');
      
      // Delete the user account
      await deleteUser(userCredential.user);
      console.log('✅ User account deleted');
    } catch (error) {
      console.error('⚠️ Error during cleanup:', error);
    }
    
    console.log('\n🎉 Test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testUserPermissions();
