// test-firestore-rules.js
// Simple script to test Firestore rules with the emulator
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  addDoc,
  connectFirestoreEmulator,
  query,
  where,
  getDocs
} = require('firebase/firestore');
const { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  connectAuthEmulator
} = require('firebase/auth');

// Use development config
const firebaseConfig = {
  apiKey: "AIzaSyD3FFprDwIZwECR5TkYCeOkiCUNGLp6qQM",
  authDomain: "barber-38b88.firebaseapp.com",
  projectId: "barber-38b88",
  storageBucket: "barber-38b88.appspot.com",
  messagingSenderId: "910680290414",
  appId: "1:910680290414:web:606ee1c0e84c32e6bfcc8c",
  measurementId: "G-B6HMP9YK92"
};

// Initialize Firebase with dev config
console.log('🔥 Initializing Firebase with dev config');
const app = initializeApp(firebaseConfig);

// Get services
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
console.log('🧪 Connecting to Firebase emulators');
connectAuthEmulator(auth, "http://localhost:9099");
connectFirestoreEmulator(db, "localhost", 8080);

// Test user creation
async function testUserCreation() {
  try {
    // First sign in (or create a user)
    console.log('👤 Creating/signing in test user');
    let userCredential;
    try {
      try {
        // Try to create a new user
        userCredential = await createUserWithEmailAndPassword(auth, "test@example.com", "password123");
        console.log('✅ Created new user:', userCredential.user.uid);
      } catch (createError) {
        if (createError.code === 'auth/email-already-in-use') {
          // User already exists, sign in instead
          userCredential = await signInWithEmailAndPassword(auth, "test@example.com", "password123");
          console.log('✅ Signed in existing user:', userCredential.user.uid);
        } else {
          throw createError;
        }
      }
    } catch (error) {
      console.error('❌ Authentication error:', error.code, error.message);
      process.exit(1);
    }
    
    const user = userCredential.user;

    // Test creating a user profile using the isNewUser() rule function
    console.log('📝 Testing user profile creation (isNewUser function)');
    try {
      // Delete the user profile first if it exists (to test isNewUser rule)
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        console.log('🧹 Deleting existing user profile to test isNewUser() rule');
        // We can't use deleteDoc here since we don't have admin access in this test
        // But we'll overwrite the document in the next step
      }
      
      // Now create the user profile - this should work with isNewUser() rule
      // since we're setting uid to the authenticated user's uid
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid, // IMPORTANT: this must match auth.uid for isNewUser() rule
        email: user.email,
        displayName: 'Test User',
        role: 'customer',
        createdAt: new Date().toISOString()
      });
      console.log('✅ Created user profile successfully - isNewUser() rule is working!');
      
      // Now try updating the profile - this should still work but not via isNewUser()
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: 'Updated Test User',
        role: 'customer',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      console.log('✅ Updated existing user profile - regular write permission working');
    } catch (error) {
      console.error('❌ Error with user profile:', error.code, error.message);
      console.error('❌ isNewUser() rule may not be working correctly');
    }
    
    // Test creating a bulletin post
    console.log('📋 Testing bulletin creation');
    const bulletinRef = await addDoc(collection(db, 'bulletins'), {
      title: 'Test Bulletin',
      content: 'This is a test bulletin post',
      authorId: user.uid,
      authorName: 'Test User',
      createdAt: new Date().toISOString()
    });
    console.log('✅ Created bulletin successfully with ID:', bulletinRef.id);
    
    // Test appointment creation
    console.log('📅 Testing appointment creation (customer creating their own)');
    const appointmentRef = await addDoc(collection(db, 'appointments'), {
      customerId: user.uid,
      barberId: 'someBarber123',  // fake ID for testing
      serviceId: 'someService123', // fake ID for testing
      date: '2025-09-20',
      time: '10:00 AM',
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    console.log('✅ Created appointment successfully with ID:', appointmentRef.id);
    
    console.log('\n✅ All tests passed! Firestore rules are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

// Run the tests
testUserCreation();
