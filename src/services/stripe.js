import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import { initStripe, presentPaymentSheet, initPaymentSheet } from '@stripe/stripe-react-native';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '@/services/firebase';

// Remove any top-level console.warn/throw/fetch. Keep everything inside functions.

// Update your getStripeKey function to ensure consistency
export const getStripeKey = () => {
  // Always use test mode for development and testing
  return process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_TEST_KEY;
};

export const getAppEnv = () => {
  const extra = (Constants?.expoConfig && Constants.expoConfig.extra) || {};
  return {
    buildType: extra.buildType,
    isTestFlight: !!extra.isTestFlight,
    platform: Platform.OS
  };
};

export const platformId = () => (Platform.OS === 'ios' ? 'ios' : 'android');

export async function checkBackendHealth(url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { return { ok: false, error: 'Non-JSON response', body: text.slice(0, 120) }; }
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// Initialize Firestore and Functions
const db = getFirestore(app);
const functions = getFunctions(app);

/**
 * Creates and presents a Stripe payment sheet for service payment
 * @param {string} customerId - Firebase user ID of the customer
 * @param {string} barberId - Firebase user ID of the barber
 * @param {string} appointmentId - ID of the appointment
 * @param {number} amount - Price of the service in USD
 * @param {string} description - Description of the service
 * @returns {Promise<{success: boolean, error?: any, canceled?: boolean, demo?: boolean}>}
 */
export const createAndPresentServicePaymentSheet = async (
  customerId,
  barberId,
  appointmentId,
  amount,
  description
) => {
  try {
    console.log('Creating payment sheet for:', {
      customerId,
      barberId,
      appointmentId,
      amount,
      description
    });

    if (!amount || amount <= 0) {
      console.error('Invalid payment amount:', amount);
      return { success: false, error: 'Invalid payment amount' };
    }

    // Get additional appointment information from Firestore
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (!appointmentSnap.exists()) {
      return { success: false, error: 'Appointment not found' };
    }
    
    const appointment = appointmentSnap.data();
    
    // Get customer information from Firestore
    const customerRef = doc(db, 'users', customerId);
    const customerSnap = await getDoc(customerRef);
    const customerData = customerSnap.exists() ? customerSnap.data() : {};
    
    // Extract service name and barber name from description if not available
    const serviceName = appointment.serviceName || description.split(' - ')[0] || '';
    const barberName = appointment.barberName || description.split(' - ')[1] || '';
    
    // Format parameters to match exactly what the backend expects
    const paymentParams = {
      amount: amount, // Add this comma
      currency: 'usd',
      description: description,
      
      // Rename customerId to customer_id as expected by backend
      customer_id: customerId,
      
      // Add customer information
      customer_email: customerData.email || '',
      customer_name: customerData.displayName || `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim() || 'Customer',
      
      // Add service and barber information
      service_name: serviceName,
      barber_name: barberName,
      
      // Add appointment date and time
      appointment_date: appointment.date || '',
      appointment_time: appointment.time || '',
      
      
      // Add metadata
      metadata: {
        appointmentId,
        barberId,
        customerId
      }
    };
    
    console.log('Calling createPaymentIntent with formatted params:', paymentParams);
    
    // Call Cloud Function to create payment intent
// filepath: /Users/josephmurphy/barber-clean/src/services/stripe.js
const BACKEND_URL = process.env.EXPO_PUBLIC_STRIPE_BACKEND_URL;
const bypassSecret = process.env.EXPO_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET;

// Only append the bypass parameter if the secret exists
const url = bypassSecret 
  ? `${BACKEND_URL}/create-payment-intent?x-vercel-protection-bypass=${bypassSecret}`
  : `${BACKEND_URL}/create-payment-intent`;
  
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    ...paymentParams,
    mode: 'test'
  })
});

// Then use the mode from the response
const responseData = await response.json();
console.log('Payment intent created successfully:', responseData);

// Extract only the fields that actually exist in the response
const { clientSecret, ephemeralKey, customer } = responseData;

console.log('FORCING TEST MODE for development and App Store review');
// Use 'let' instead of 'const' so it can be reassigned
let publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_TEST_KEY;
console.log('Using TEST publishable key:', publishableKey ? publishableKey.substring(0, 10) + '...' : 'MISSING KEY');

// Now this works because 'let' allows reassignment
if (!publishableKey) {
  console.error('ERROR: Test publishable key is missing or undefined!');
  publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_LIVE_KEY;
  console.log('Falling back to live key');
}
    if (!clientSecret) {
      console.error('Failed to get client secret from backend');
      return { success: false, error: 'Failed to initialize payment' };
    }
    
    // Initialize the Stripe SDK with your publishable key
    console.log('Using Stripe publishable key:', publishableKey.substring(0, 10) + '...');

try {
  // First initialize the Stripe SDK
  await initStripe({
    publishableKey,
    stripeAccountId: responseData.stripeAccountId || undefined
  });
  
  console.log('Stripe SDK initialized successfully');
  
  // Initialize the payment sheet with absolute minimal configuration
  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    // Only include the absolute essentials
    merchantDisplayName: 'Barber App',
    returnURL: 'barberscheduler://payment-return',
  });

  if (initError) {
    console.error('Payment sheet initialization error:', initError.code, initError.message);
    return { success: false, error: initError };
  }

  console.log('Payment sheet initialized successfully');

  // Add a short delay to ensure the payment intent is ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Present the payment sheet with minimal configuration
  const { error: paymentError } = await presentPaymentSheet();
  
  if (paymentError) {
    console.log('Payment sheet error:', paymentError.code, paymentError.message);
    
    if (paymentError.code === 'Canceled') {
      return { success: false, canceled: true };
    }
    
    return { success: false, error: paymentError };
  }

  // If no error, payment succeeded
  console.log('Payment successful for appointment:', appointmentId);
  
  // Update appointment payment status
  await updateDoc(doc(db, 'appointments', appointmentId), {
    paymentStatus: 'paid',
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return { success: true };

} catch (error) {
  console.error('Payment process error:', error);
  return { success: false, error };
}
  } catch (error) {
    console.error('Error in payment process:', error);
    return { success: false, error };
  }
};

/**
 * Gets the payment status of an appointment
 * @param {string} appointmentId - The appointment ID
 * @returns {Promise<{isPaid: boolean, amount?: number, paidAt?: Date}>}
 */
export const getAppointmentPaymentStatus = async (appointmentId) => {
  try {
    if (!appointmentId) {
      console.error('No appointment ID provided for payment status check');
      return { isPaid: false, error: 'No appointment ID provided' };
    }
    
    // Get the appointment document from Firestore
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (!appointmentSnap.exists()) {
      console.error('Appointment not found for payment status check:', appointmentId);
      return { isPaid: false, error: 'Appointment not found' };
    }
    
    const appointmentData = appointmentSnap.data();
    
    // Check if the appointment has been paid
    const isPaid = appointmentData.paymentStatus === 'paid';
    
    // Get the amount and payment date if available
    const amount = appointmentData.price || appointmentData.servicePrice || 0;
    const paidAt = appointmentData.paidAt ? new Date(appointmentData.paidAt.toDate?.() || appointmentData.paidAt) : null;
    
    return {
      isPaid,
      amount,
      paidAt
    };
  } catch (error) {
    console.error('Error getting payment status:', error);
    return { isPaid: false, error: error.message };
  }
};

// Add these functions to src/services/stripe.js

/**
 * Sets up a Stripe Connect account for a barber
 * @param {string} barberId - The barber's user ID
 * @param {Object} options - Configuration options
 * @param {string} options.email - Barber's email address
 * @param {string} options.name - Barber's name or business name
 * @param {string} options.returnUrl - URL to return to after onboarding
 * @param {string} options.refreshUrl - URL to return to if onboarding needs to be refreshed
 * @returns {Promise<{url: string}>} - Object containing the onboarding URL
 */
export const setupStripeConnectAccount = async (barberId, name, email) => {
  try {
    console.log('Setting up Stripe Connect account for barber:', barberId);
    console.log('Name:', name, 'Email:', email);
    
    // Use the app scheme for deep linking
    const appScheme = 'barberscheduler://';
    const returnUrl = `${appScheme}stripe-connect-return`;
    const refreshUrl = `${appScheme}stripe-connect-refresh`;
    
    // Also define webReturnUrl and webRefreshUrl for web support
    const webReturnUrl = returnUrl;     
    // e.g. barberscheduler://stripe-connect-return
    const webRefreshUrl = refreshUrl;   
    // e.g. barberscheduler://stripe-connect-refresh
    
    console.log('Return URL:', returnUrl);
    console.log('Refresh URL:', refreshUrl);
    
    const BACKEND_URL = process.env.EXPO_PUBLIC_STRIPE_BACKEND_URL;
    const bypassSecret = process.env.EXPO_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET;
    
    // Debugging logs
    console.log('Backend URL:', BACKEND_URL);
    console.log('Using bypass secret:', !!bypassSecret);
    
    // Make a POST request to create-account-link endpoint
    const response = await fetch(`${BACKEND_URL}/create-account-link?x-vercel-protection-bypass=${bypassSecret}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barberId: barberId,
        email: email,
        name: name || 'Barber',
        returnUrl: returnUrl,
        refreshUrl: refreshUrl
      })
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Stripe Connect setup failed:', errorData);
      throw new Error('Failed to set up Stripe Connect account');
    }
    
    const data = await response.json();
    console.log('Account link created successfully');
    
    if (data.url) {
      console.log('Opening Stripe Connect URL:', data.url);
      await Linking.openURL(data.url);
      return true;
    } else {
      throw new Error('No URL returned from Stripe');
    }
  } catch (error) {
    console.error('❌ Stripe Connect setup error:', error);
    throw error;
  }
};

/**
 * Checks the status of a barber's Stripe Connect account
 * @param {string} barberId - The barber's user ID
 * @returns {Promise<Object>} - Object containing account status
 */
export const checkStripeConnectStatus = async (barberId) => {
  try {
    const BACKEND_URL = process.env.EXPO_PUBLIC_STRIPE_BACKEND_URL;
    const bypassSecret = process.env.EXPO_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET;
    
    const url = `${BACKEND_URL}/check-account-status?barberId=${barberId}&x-vercel-protection-bypass=${bypassSecret}`;
    
    console.log('Checking Stripe Connect status at:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stripe Connect status check failed:', errorText);
      throw new Error('Failed to check Stripe Connect status');
    }
    
    const data = await response.json();
    console.log('Stripe Connect status:', data);
    
    return data;
  } catch (error) {
    console.error('Stripe Connect status check error:', error);
    throw error;
  }
};

// Add or fix this function
export const createSubscriptionPaymentSheet = async (customerId, priceId) => {
  try {
    const BACKEND_URL = process.env.EXPO_PUBLIC_STRIPE_BACKEND_URL;
    const bypassSecret = process.env.EXPO_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET;
    
    // Remove this line which is overriding your parameter
    // const priceId = process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTION_PRICE_ID;
    
    // Use default price ID if one wasn't provided
    const finalPriceId = process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTION_PRICE_ID;
    
    console.log('Creating subscription with:', { customerId, priceId: finalPriceId });
    
    const url = `${BACKEND_URL}/create-subscription?x-vercel-protection-bypass=${bypassSecret}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        priceId: finalPriceId,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create subscription: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Subscription creation error:', error);
    throw error;
  }
};

// In src/services/stripe.js
export const getOrCreateCustomer = async (userId, email, name) => {
  try {
    const BACKEND_URL = process.env.EXPO_PUBLIC_STRIPE_BACKEND_URL;
    const bypassSecret = process.env.EXPO_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET;
    
    const url = `${BACKEND_URL}/create-customer?x-vercel-protection-bypass=${bypassSecret}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email,
        name
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create customer: ${errorText}`);
    }
    
    const data = await response.json();
    return data.customerId;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};
