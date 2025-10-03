import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Linking } from 'react-native';
import { createUserProfile } from '@/services/firebase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createSubscriptionPaymentSheet, getOrCreateCustomer, setupStripeConnectAccount } from '@/services/stripe';
import { auth } from '@/services/firebase';

const ProfileSetupScreen = () => {
  // Existing state variables
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [isBarber, setIsBarber] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stripeConnectSetup, setStripeConnectSetup] = useState(false); // New state for tracking Stripe Connect setup

  // New function to handle Stripe Connect setup
  const handleStripeConnectSetup = async (userId, name, email) => {
    try {
      console.log('🔔 Setting up Stripe Connect account...');
      console.log('Setting up Stripe Connect account for barber:', userId);
      
      // Fix: Pass the parameters correctly as separate values, not as an object
      const result = await setupStripeConnectAccount(
        userId,  // First parameter: userId
        name,    // Second parameter: name 
        email    // Third parameter: email
      );
      
      if (result) {
        // No need to navigate here - the user will be redirected back via deep link
        return true;
      } else {
        throw new Error('Failed to set up Stripe Connect account');
      }
    } catch (error) {
      console.error('❌ Stripe Connect setup error:', error);
      Alert.alert('Setup Error', 'Could not set up payment account. Please try again later.');
      return false;
    }
  };

  // Modified handleBarberSubscription with better error handling
  const handleBarberSubscription = async () => {
    try {
      setLoading(true);
      console.log('🔔 Creating barber subscription...');
      
      // Step 1: Create a Stripe customer first
      console.log('Creating Stripe customer for user:', userId);
      
      let stripeCustomerId;
      try {
        // Get the user's email from auth if available
        const userEmail = auth?.currentUser?.email || userId;
        
        stripeCustomerId = await getOrCreateCustomer(
          userId,
          userEmail, // Use actual email if possible
          name
        );
        console.log('Created/retrieved Stripe customer ID:', stripeCustomerId);
      } catch (customerError) {
        console.error('❌ Customer creation failed:', customerError);
        Alert.alert(
          'Account Setup Error',
          'We could not set up your payment account. Without this, you cannot accept payments from customers. Please try again or contact support.',
          [{ text: 'OK' }]
        );
        return false; // Critical failure - don't allow continuing
      }
      
      // Step 2: Create subscription with the Stripe customer ID
      const BARBER_SUBSCRIPTION_PRICE_ID = process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTION_PRICE_ID || 'price_1RvYTZ5qb1EkwiNr5xBt0AgM';
      
      try {
        const subscriptionResult = await createSubscriptionPaymentSheet(
          stripeCustomerId,
          BARBER_SUBSCRIPTION_PRICE_ID
        );
        
        if (subscriptionResult.subscriptionId) {
          console.log('✅ Subscription created successfully:', subscriptionResult);
          
          // After successful subscription, set up Stripe Connect
          Alert.alert(
            'Subscription Created',
            'Your subscription is active! Next, let\'s set up how you\'ll receive payments from customers.',
            [
              {
                text: 'Set Up Payments',
                onPress: () => handleStripeConnectSetup(userId, name, auth?.currentUser?.email || userId)
              }
            ]
          );
          
          return true;
        } else if (subscriptionResult.canceled) {
          Alert.alert(
            'Subscription Required',
            'A subscription is required to use the barber features. You cannot continue without subscribing.',
            [{ text: 'OK' }]
          );
          return false;
        } else {
          throw new Error('Subscription creation failed');
        }
      } catch (subscriptionError) {
        console.error('❌ Subscription creation failed:', subscriptionError);
        Alert.alert(
          'Subscription Error',
          'We could not set up your subscription. A subscription is required to use barber features.',
          [{ text: 'OK' }]
        );
        return false; // Don't allow continuing without a subscription
      }
    } catch (error) {
      console.error('❌ Subscription process error:', error);
      Alert.alert(
        'Setup Error',
        'There was a problem setting up your barber account. Please try again later.',
        [{ text: 'OK' }]
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Modified handleSaveProfile to track Stripe Connect status
  const handleSaveProfile = async () => {
    try {
      if (!name || !phone || !address || !zipcode) {
        setError('Please fill in all required fields');
        return;
      }

      setLoading(true);
      setError('');

      // For barbers, handle subscription first
      if (isBarber) {
        const subscriptionSuccess = await handleBarberSubscription();
        if (!subscriptionSuccess) {
          setLoading(false);
          return;
        }
      }

      const userData = {
        name,
        phone,
        address,
        zipcode,
        role: isBarber ? 'barber' : 'customer',
        createdAt: new Date().toISOString(),
      };

      if (isBarber) {
        userData.subscription = {
          status: 'active',
          plan: 'barber_monthly',
          startDate: new Date().toISOString(),
          amount: 30,
          currency: 'usd',
        };
        
        // Add Stripe Connect status
        userData.stripeConnect = {
          setupStarted: stripeConnectSetup,
          setupCompleted: false, // Will be updated after they complete the flow
          setupDate: stripeConnectSetup ? new Date().toISOString() : null,
        };
      }

      await createUserProfile(userId, userData);

      try {
        console.log('Navigation after profile setup:', isBarber ? 'barber' : 'customer');
        
        if (isBarber) {
          // Navigate to barber dashboard
          router.replace('/(app)/(barber)/dashboard');
        } else {
          // Navigate to customer index
          router.replace('/(app)/(customer)/');
        }
      } catch (error) {
        console.error('Navigation error:', error);
        
        // Fallback navigation to root
        router.replace('/');
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your address"
          value={address}
          onChangeText={setAddress}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Zipcode</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your zipcode"
          value={zipcode}
          onChangeText={setZipcode}
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>I am a Barber</Text>
        <Switch
          value={isBarber}
          onValueChange={setIsBarber}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isBarber ? '#2196F3' : '#f4f3f4'}
        />
      </View>
      
      {isBarber && (
        <View style={styles.barberSection}>
          <Text style={styles.sectionTitle}>Barber Subscription</Text>
          <Text style={styles.sectionSubtitle}>
            $30/month - Secure payment via Stripe
          </Text>
          <Text style={styles.featuresText}>
            ✅ Accept appointments{'\n'}
            ✅ Manage your schedule{'\n'}
            ✅ Receive payments{'\n'}
            ✅ Chat with barbers{'\n'}
            ✅ Message Board
          </Text>
          
          {/* Add information about payment processing */}
          <Text style={styles.paymentInfoText}>
            After subscribing, you'll set up your payment processing to receive customer payments directly to your bank account.
          </Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSaveProfile}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? (isBarber ? 'Setting up subscription...' : 'Saving...') : (isBarber ? 'Subscribe & Continue' : 'Save Profile')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Add new styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  barberSection: {
    marginTop: 10,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  featuresText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#555',
    marginTop: 10,
    fontStyle: 'italic',
  }
});

export default ProfileSetupScreen;

