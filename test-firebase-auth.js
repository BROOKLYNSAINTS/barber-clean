// test-firebase-auth.js
// Simple test to verify Firebase Auth API key
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Configuration with direct values for testing
const firebaseConfig = {
  apiKey: "AIzaSyD3FFprDwIZwECR5TkYCeOkiCUNGLp6qQM", 
  authDomain: "barber-38b88.firebaseapp.com",
  projectId: "barber-38b88"
};

console.log("Initializing Firebase with config:", {
  apiKey: firebaseConfig.apiKey.substring(0, 8) + "...",
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log("Firebase initialized, auth object created:", !!auth);

// Test a sign-in (will fail but shows if API key is accepted)
signInWithEmailAndPassword(auth, "test@example.com", "password123")
  .then(userCredential => {
    console.log("Sign-in successful (unexpected):", userCredential.user);
  })
  .catch(error => {
    if (error.code === 'auth/invalid-email' || 
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/invalid-credential') {
      console.log("API key is valid! Got expected auth error:", error.code);
    } else if (error.code === 'auth/api-key-not-valid') {
      console.log("API key validation failed:", error.code, error.message);
    } else {
      console.log("Other error:", error.code, error.message);
    }
  });
