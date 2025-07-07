// Simple test to verify Firestore permissions
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBVlmB5qdPmcGXJBFKjRz0KhIcgslRrHy4',
  authDomain: 'barber-38b88.firebaseapp.com',
  projectId: 'barber-38b88',
  storageBucket: 'barber-38b88.appspot.com',
  messagingSenderId: '737852188063',
  appId: '1:737852188063:web:88e68f9200a80b4fd849aa',
  measurementId: 'G-DJQ1PBNCRZ',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testPaymentPermissions() {
  try {
    // Test login (use a test user email/password)
    console.log('🔐 Logging in test user...');
    // Replace with actual test credentials
    await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
    console.log('✅ Login successful');
    
    const userId = auth.currentUser.uid;
    
    // Test creating a payment record
    console.log('💳 Testing payment record creation...');
    const paymentRef = await addDoc(collection(db, 'payments'), {
      customerId: userId,
      barberId: 'test_barber_id',
      appointmentId: 'test_appointment_id',
      amount: 50.00,
      description: 'Test Payment',
      type: 'service',
      status: 'completed',
      createdAt: serverTimestamp(),
      paymentMethod: 'card'
    });
    
    console.log('✅ Payment record created:', paymentRef.id);
    
    // Test updating an appointment payment status
    console.log('📝 Testing appointment update...');
    const appointmentRef = doc(db, 'appointments', 'test_appointment_id');
    await updateDoc(appointmentRef, {
      paymentStatus: 'paid',
      paidAmount: 50.00,
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Appointment payment status updated');
    console.log('🎉 All permission tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testPaymentPermissions();
