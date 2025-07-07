// Quick test to verify Stripe integration is working
// Run this in the app console or create a button to test it

import { createAndPresentServicePaymentSheet } from '@/services/stripe';
import { auth } from '@/services/firebase';

// Test function you can call to verify payment integration
export const testStripePayment = async () => {
  try {
    console.log('🧪 Testing Stripe payment integration...');
    
    const result = await createAndPresentServicePaymentSheet(
      auth.currentUser?.uid || 'test_user',
      'test_barber_id',
      'test_appointment_id',
      25.00, // $25 test amount
      'Test Haircut Service'
    );
    
    if (result.success) {
      if (result.demo) {
        console.log('✅ Demo payment processed successfully');
        return { success: true, mode: 'demo' };
      } else {
        console.log('✅ Real Stripe payment processed successfully');
        return { success: true, mode: 'stripe' };
      }
    } else if (result.canceled) {
      console.log('ℹ️ Payment was canceled by user');
      return { success: false, canceled: true };
    } else {
      console.log('❌ Payment failed');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Test payment error:', error);
    return { success: false, error: error.message };
  }
};

// Instructions for testing:
/*
1. Open React Native debugger
2. Import this file: import { testStripePayment } from './test-stripe'
3. Call: testStripePayment().then(console.log)
4. Check the result:
   - { success: true, mode: 'demo' } = Demo mode (backend not configured)
   - { success: true, mode: 'stripe' } = Real Stripe integration working
   - { success: false, canceled: true } = User canceled
   - { success: false, error: "..." } = Error occurred
*/
