// test-rules-basic.js
// Simpler script to test just the Firestore connection without auth
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  getDocs,
  connectFirestoreEmulator 
} = require('firebase/firestore');

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

// Get Firestore
const db = getFirestore(app);

// Connect to emulator
console.log('🧪 Connecting to Firestore emulator');
connectFirestoreEmulator(db, "localhost", 8080);

async function testBulletinsRead() {
  try {
    // Test reading bulletins (should be public)
    console.log('📋 Testing bulletins read (public)');
    const bulletinsRef = collection(db, 'bulletins');
    const querySnapshot = await getDocs(bulletinsRef);
    console.log(`✅ Successfully read ${querySnapshot.size} bulletins`);
    
    querySnapshot.forEach(doc => {
      console.log(`  📌 Bulletin ${doc.id}: ${JSON.stringify(doc.data())}`);
    });
    
    if (querySnapshot.size === 0) {
      console.log('   No bulletins found. Creating a test bulletin...');
      try {
        await setDoc(doc(db, 'bulletins', 'test-bulletin'), {
          title: 'Test Bulletin',
          content: 'This is a test bulletin created by the emulator',
          authorId: 'test-user',
          createdAt: new Date().toISOString()
        });
        console.log('   ✅ Created test bulletin');
      } catch (error) {
        console.log('   ❌ Failed to create test bulletin:', error.message);
      }
    }
    
    console.log('\n✅ Basic read test passed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

// Run the test
testBulletinsRead();
