import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Manually define the config — DO NOT use @env
const firebaseConfig = {
  apiKey: 'AIzaSyBVlmB5qdPmcGXJBFKjRz0KhIcgslRrHy4',
  authDomain: 'barber-38b88.firebaseapp.com',
  projectId: 'barber-38b88',
  storageBucket: 'barber-38b88.appspot.com',
  messagingSenderId: '737852188063',
  appId: '1:737852188063:web:88e68f9200a80b4fd849aa',
  measurementId: 'G-DJQ1PBNCRZ',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Run test
loginUser('your-test-email@gmail.com', 'your-password')
  .then((user) => console.log('✅ Firebase login success:', user.email))
  .catch((error) => console.error('❌ Firebase login error:', error.message));
