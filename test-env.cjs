// test-env.cjs - Test environment variables loading
require('dotenv').config();

process.stdout.write('Firebase Environment Variables:\n');
process.stdout.write('---------------------------------------\n');
process.stdout.write(`FIREBASE_DEV_API_KEY: ${process.env.FIREBASE_DEV_API_KEY ? 'Present' : 'Missing'}\n`);
process.stdout.write(`FIREBASE_DEV_PROJECT_ID: ${process.env.FIREBASE_DEV_PROJECT_ID}\n`);
process.stdout.write(`FIREBASE_DEV_AUTH_DOMAIN: ${process.env.FIREBASE_DEV_AUTH_DOMAIN}\n`);
process.stdout.write(`FIREBASE_PROD_API_KEY: ${process.env.FIREBASE_PROD_API_KEY ? 'Present' : 'Missing'}\n`);
process.stdout.write(`FIREBASE_PROD_PROJECT_ID: ${process.env.FIREBASE_PROD_PROJECT_ID}\n`);
process.stdout.write('---------------------------------------\n');

// Attempt to initialize Firebase
const { initializeApp } = require('firebase/app');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_DEV_API_KEY,
  authDomain: process.env.FIREBASE_DEV_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_DEV_PROJECT_ID,
  storageBucket: process.env.FIREBASE_DEV_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_DEV_APP_ID
};

console.log('Firebase Config:');
console.log('---------------------------------------');
console.log('API Key:', firebaseConfig.apiKey ? 'Present' : 'Missing');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);
console.log('Storage Bucket:', firebaseConfig.storageBucket);
console.log('Messaging Sender ID:', firebaseConfig.messagingSenderId);
console.log('App ID:', firebaseConfig.appId);
console.log('---------------------------------------');

try {
  const app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully!');
} catch (error) {
  console.error('Firebase initialization failed:', error);
}
