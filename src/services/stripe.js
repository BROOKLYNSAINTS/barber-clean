import { Platform } from 'react-native';
import { initStripe, useStripe } from '@stripe/stripe-react-native';
import { StripeProvider } from '@stripe/stripe-react-native';

import Constants from 'expo-constants';
import { db, auth } from './firebase';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
// Initialize Stripe with publishable key
// In a production app, this should be stored securely
const STRIPE_PUBLISHABLE_KEY = 'pk_test_dummyKeyForDemoPurposesOnly';

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

export default {
  initializeStripe,
  createSubscriptionPaymentSheet,
  createTipPaymentSheet,
  processSubscriptionPayment,
  processTipPayment,
  getSubscriptionStatus,
  cancelSubscription,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod
};
