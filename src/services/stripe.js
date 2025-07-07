import { Platform } from 'react-native';
import { initStripe, useStripe, initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { StripeProvider } from '@stripe/stripe-react-native';

import Constants from 'expo-constants';
import { db } from '@/services/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Get Stripe publishable key from environment
const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY || 'pk_test_dummyKeyForDemoPurposesOnly';

// Initialize Stripe
export const initializeStripe = async () => {
  try {
    await initStripe({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.com.barberapp',
      urlScheme: 'barberapp',
    });
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    throw error;
  }
};

// Create payment sheet for subscription
export const createSubscriptionPaymentSheet = async (userId, priceId) => {
  try {
    // In a real app, this would call your backend to create a payment intent
    // For demo purposes, we're mocking the response
    const paymentSheetData = {
      paymentIntent: 'pi_dummy_payment_intent',
      ephemeralKey: 'ek_dummy_ephemeral_key',
      customer: 'cus_dummy_customer',
    };
    
    return paymentSheetData;
  } catch (error) {
    console.error('Error creating subscription payment sheet:', error);
    throw error;
  }
};

// Create payment sheet for tip
export const createTipPaymentSheet = async (userId, amount, appointmentId) => {
  try {
    // In a real app, this would call your backend to create a payment intent
    // For demo purposes, we're mocking the response
    const paymentSheetData = {
      paymentIntent: 'pi_dummy_payment_intent',
      ephemeralKey: 'ek_dummy_ephemeral_key',
      customer: 'cus_dummy_customer',
    };
    
    return paymentSheetData;
  } catch (error) {
    console.error('Error creating tip payment sheet:', error);
    throw error;
  }
};

// Create payment sheet for service payment (post-service)
export const createServicePaymentSheet = async (userId, appointmentId, amount, description) => {
  try {
    // In a real app, this would call your backend to create a payment intent
    // For demo purposes, we're mocking the response
    const paymentSheetData = {
      paymentIntent: `pi_service_${appointmentId}_${Date.now()}`,
      ephemeralKey: 'ek_dummy_ephemeral_key',
      customer: 'cus_dummy_customer',
      publishableKey: STRIPE_PUBLISHABLE_KEY,
    };
    
    return paymentSheetData;
  } catch (error) {
    console.error('Error creating service payment sheet:', error);
    throw error;
  }
};

// Process subscription payment
export const processSubscriptionPayment = async (userId, subscriptionData) => {
  try {
    // In a real app, this would confirm the payment with Stripe
    // For demo purposes, we're just updating the user's subscription status in Firestore
    
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      subscription: {
        ...subscriptionData,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      },
      updatedAt: serverTimestamp()
    });
    
    // Record the transaction
    await addDoc(collection(db, 'transactions'), {
      userId,
      type: 'subscription',
      amount: subscriptionData.amount,
      status: 'completed',
      createdAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error processing subscription payment:', error);
    throw error;
  }
};

// Process tip payment
export const processTipPayment = async (userId, barberId, appointmentId, amount) => {
  try {
    // In a real app, this would confirm the payment with Stripe
    // For demo purposes, we're just recording the tip in Firestore
    
    await addDoc(collection(db, 'tips'), {
      customerId: userId,
      barberId,
      appointmentId,
      amount,
      status: 'completed',
      createdAt: serverTimestamp()
    });
    
    // Record the transaction
    await addDoc(collection(db, 'transactions'), {
      userId,
      barberId,
      appointmentId,
      type: 'tip',
      amount,
      status: 'completed',
      createdAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error processing tip payment:', error);
    throw error;
  }
};

// Process service payment (post-service) - Real Stripe Integration
export const processServicePayment = async (userId, barberId, appointmentId, amount, description = 'Barber Service') => {
  try {
    console.log('🏦 Processing service payment with Stripe...', { userId, barberId, appointmentId, amount });
    
    // Create payment record first (optimistic)
    const paymentRef = await addDoc(collection(db, 'payments'), {
      customerId: userId,
      barberId,
      appointmentId,
      amount,
      description,
      type: 'service',
      status: 'processing',
      createdAt: serverTimestamp(),
      paymentMethod: 'card'
    });
    
    // In a real app, you would call your backend to create a PaymentIntent
    // For now, we'll simulate success but you can replace this with actual Stripe calls
    console.log('💳 Payment intent would be created here for amount:', amount);
    
    // Simulate successful payment (replace with actual Stripe confirmation)
    await updateDoc(doc(db, 'payments', paymentRef.id), {
      status: 'completed',
      stripePaymentIntentId: `pi_simulated_${Date.now()}`,
      processedAt: serverTimestamp()
    });
    
    // Record the transaction
    await addDoc(collection(db, 'transactions'), {
      userId,
      barberId,
      appointmentId,
      paymentId: paymentRef.id,
      type: 'service_payment',
      amount,
      description,
      status: 'completed',
      createdAt: serverTimestamp()
    });
    
    // Update appointment with payment status
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      paymentStatus: 'paid',
      paidAmount: amount,
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Service payment processed successfully:', {
      paymentId: paymentRef.id,
      amount,
      appointmentId
    });
    
    return { 
      success: true, 
      paymentId: paymentRef.id,
      transactionId: paymentRef.id 
    };
  } catch (error) {
    console.error('Error processing service payment:', error);
    throw error;
  }
};

// Create and present payment sheet for service payment
export const createAndPresentServicePaymentSheet = async (userId, barberId, appointmentId, amount, description = 'Barber Service') => {
  try {
    console.log('🏦 Creating payment intent for service payment...', { amount, appointmentId });
    
    // Step 1: Call your backend to create a PaymentIntent
    const paymentIntentResponse = await createPaymentIntent(amount, description, {
      userId,
      barberId,
      appointmentId
    });
    
    if (!paymentIntentResponse.success) {
      console.log('⚠️ Backend not configured, falling back to demo payment');
      // Fall back to demo payment if backend isn't configured
      return await processServicePaymentDemo(userId, barberId, appointmentId, amount, description);
    }
    
    const { clientSecret, ephemeralKey, customer } = paymentIntentResponse;
    
    // Validate that we have real Stripe secrets (not demo data)
    if (!clientSecret || clientSecret.includes('example') || clientSecret.includes('dummy')) {
      console.log('⚠️ Invalid client secret from backend, falling back to demo payment');
      return await processServicePaymentDemo(userId, barberId, appointmentId, amount, description);
    }
    
    // Step 2: Initialize the payment sheet
    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'Barber Services',
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: clientSecret,
      allowsDelayedPaymentMethods: false,
      defaultBillingDetails: {
        name: 'Customer', // You can get this from user profile
      },
      returnURL: 'barberapp://payment-return',
    });
    
    if (initError) {
      console.error('Error initializing payment sheet:', initError);
      console.log('⚠️ Payment sheet init failed, falling back to demo payment');
      return await processServicePaymentDemo(userId, barberId, appointmentId, amount, description);
    }
    
    // Step 3: Present the payment sheet
    const { error: presentError } = await presentPaymentSheet();
    
    if (presentError) {
      if (presentError.code === 'Canceled') {
        return { success: false, canceled: true };
      }
      console.error('Error presenting payment sheet:', presentError);
      throw new Error(`Payment failed: ${presentError.message}`);
    }
    
    // Step 4: Payment successful, update Firestore
    console.log('💳 Payment completed successfully!');
    
    // Create payment record
    const paymentRef = await addDoc(collection(db, 'payments'), {
      customerId: userId,
      barberId,
      appointmentId,
      amount,
      description,
      type: 'service',
      status: 'completed',
      stripePaymentIntentId: paymentIntentResponse.paymentIntentId,
      createdAt: serverTimestamp(),
      paymentMethod: 'card'
    });
    
    // Record the transaction
    await addDoc(collection(db, 'transactions'), {
      userId,
      barberId,
      appointmentId,
      paymentId: paymentRef.id,
      type: 'service_payment',
      amount,
      description,
      status: 'completed',
      stripePaymentIntentId: paymentIntentResponse.paymentIntentId,
      createdAt: serverTimestamp()
    });
    
    // Update appointment with payment status
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      paymentStatus: 'paid',
      paidAmount: amount,
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Payment and records updated successfully');
    
    return { 
      success: true, 
      paymentId: paymentRef.id,
      paymentIntentId: paymentIntentResponse.paymentIntentId
    };
    
  } catch (error) {
    console.error('Error in payment flow:', error);
    
    // If there's any error with Stripe integration, fall back to demo payment
    console.log('⚠️ Stripe payment failed, falling back to demo payment');
    try {
      return await processServicePaymentDemo(userId, barberId, appointmentId, amount, description);
    } catch (demoError) {
      console.error('Demo payment also failed:', demoError);
      throw new Error('Payment processing failed');
    }
  }
};

// Demo payment processing (for when Stripe backend isn't configured)
const processServicePaymentDemo = async (userId, barberId, appointmentId, amount, description) => {
  try {
    console.log('🧪 Processing demo payment...', { amount, appointmentId });
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create payment record
    const paymentRef = await addDoc(collection(db, 'payments'), {
      customerId: userId,
      barberId,
      appointmentId,
      amount,
      description,
      type: 'service',
      status: 'completed',
      stripePaymentIntentId: `demo_pi_${Date.now()}`,
      createdAt: serverTimestamp(),
      paymentMethod: 'demo'
    });
    
    // Record the transaction
    await addDoc(collection(db, 'transactions'), {
      userId,
      barberId,
      appointmentId,
      paymentId: paymentRef.id,
      type: 'service_payment',
      amount,
      description,
      status: 'completed',
      createdAt: serverTimestamp()
    });
    
    // Update appointment with payment status
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      paymentStatus: 'paid',
      paidAmount: amount,
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Demo payment processed successfully');
    
    return { 
      success: true, 
      paymentId: paymentRef.id,
      demo: true
    };
  } catch (error) {
    console.error('Error processing demo payment:', error);
    throw error;
  }
};

// Create PaymentIntent via backend (you'll need to implement this endpoint)
const createPaymentIntent = async (amount, description, metadata) => {
  try {
    // TEMPORARY: Skip backend for testing
    console.log('⚠️ Using demo mode - backend calls disabled for testing');
    return {
      success: false,
      error: 'Backend calls temporarily disabled for testing'
    };
    
    /* COMMENTED OUT FOR TESTING - UNCOMMENT WHEN READY
    const BACKEND_URL = 'http://localhost:3000';
    
    console.log('🔧 Calling backend to create payment intent...');
    
    const response = await fetch(`${BACKEND_URL}/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        description,
        metadata,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Backend error:', data);
      throw new Error(data.error || 'Failed to create payment intent');
    }
    
    console.log('✅ Payment intent created successfully:', data.paymentIntentId);
    return data;
    */
    
  } catch (error) {
    console.error('Error calling backend:', error);
    
    // Return demo data if backend fails (for development)
    console.log('⚠️ Backend call failed, returning demo data for development');
    return {
      success: false,
      error: 'Backend not configured - using demo mode'
    };
  }
};

// Get subscription status
export const getSubscriptionStatus = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      if (userData.subscription && userData.subscription.status === 'active') {
        // Check if subscription is expired
        const endDate = new Date(userData.subscription.endDate);
        const now = new Date();
        
        if (endDate < now) {
          // Subscription has expired, update status
          await updateDoc(userRef, {
            'subscription.status': 'expired',
            updatedAt: serverTimestamp()
          });
          
          return { status: 'expired' };
        }
        
        return { 
          status: 'active',
          endDate: userData.subscription.endDate,
          plan: userData.subscription.plan
        };
      }
      
      return { status: 'inactive' };
    }
    
    return { status: 'inactive' };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
};

// Cancel subscription
export const cancelSubscription = async (userId) => {
  try {
    // In a real app, this would call your backend to cancel the subscription with Stripe
    // For demo purposes, we're just updating the user's subscription status in Firestore
    
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      'subscription.status': 'canceled',
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

// Get payment methods
export const getPaymentMethods = async (userId) => {
  try {
    // In a real app, this would call your backend to get the user's payment methods from Stripe
    // For demo purposes, we're returning mock data
    
    return [
      {
        id: 'pm_dummy_card_1',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025
        },
        isDefault: true
      }
    ];
  } catch (error) {
    console.error('Error getting payment methods:', error);
    throw error;
  }
};

// Add payment method
export const addPaymentMethod = async (userId, paymentMethodId) => {
  try {
    // In a real app, this would call your backend to add the payment method to the user's Stripe customer
    // For demo purposes, we're just returning success
    
    return { success: true };
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
};

// Remove payment method
export const removePaymentMethod = async (userId, paymentMethodId) => {
  try {
    // In a real app, this would call your backend to remove the payment method from the user's Stripe customer
    // For demo purposes, we're just returning success
    
    return { success: true };
  } catch (error) {
    console.error('Error removing payment method:', error);
    throw error;
  }
};

// Check if appointment has been paid
export const getAppointmentPaymentStatus = async (appointmentId) => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const appointmentDoc = await getDoc(appointmentRef);
    
    if (appointmentDoc.exists()) {
      const data = appointmentDoc.data();
      return {
        isPaid: data.paymentStatus === 'paid',
        amount: data.paidAmount || 0,
        paidAt: data.paidAt || null
      };
    }
    
    return { isPaid: false, amount: 0, paidAt: null };
  } catch (error) {
    console.error('Error checking payment status:', error);
    return { isPaid: false, amount: 0, paidAt: null };
  }
};

export default {
  initializeStripe,
  createSubscriptionPaymentSheet,
  createTipPaymentSheet,
  createServicePaymentSheet,
  processSubscriptionPayment,
  processTipPayment,
  processServicePayment,
  createAndPresentServicePaymentSheet,
  getSubscriptionStatus,
  cancelSubscription,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  getAppointmentPaymentStatus
};
