import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useStripe } from '@stripe/stripe-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { stripeConfig } from '../../../src/services/stripeConfig';
import { Button } from '../../../src/components/UIComponents';

/**
 * Web-based payment solution that uses a WebView to display Stripe Checkout
 * This approach bypasses the problematic Payment Sheet completely
 */
const WebBasedPayment = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { createPaymentIntent } = useStripe();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [webViewUrl, setWebViewUrl] = useState(null);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('initial');
  
  // Backend URL from config
  const BACKEND_URL = stripeConfig.backendUrl || 'https://barber-backend-ten.vercel.app';
  
  // Create a payment session for the web view
  const createPaymentSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user information (you would retrieve this from your auth system)
      const userInfo = {
        userId: userId || 'guest-user',
        email: 'user@example.com', // In a real app, get this from authenticated user
        name: 'Test User' // In a real app, get this from authenticated user
      };
      
      // Create a payment session on your backend
      const response = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 2999, // $29.99 for subscription
          currency: 'usd',
          customerInfo: userInfo,
          successUrl: `${BACKEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${BACKEND_URL}/payment-cancel`,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment session');
      }
      
      const sessionData = await response.json();
      
      if (!sessionData.url) {
        throw new Error('No checkout URL returned from server');
      }
      
      // Set the URL for the WebView
      setWebViewUrl(sessionData.url);
      setWebViewVisible(true);
      setPaymentStatus('pending');
      
    } catch (error) {
      console.error('Payment session error:', error);
      setError(error.message || 'Failed to set up payment. Please try again.');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle WebView navigation state changes
  const handleWebViewNavigationStateChange = (newNavState) => {
    const { url } = newNavState;
    
    // Check if we've reached the success URL
    if (url && url.includes('/payment-success')) {
      setWebViewVisible(false);
      setPaymentStatus('success');
      
      // Extract the session ID if needed
      const sessionId = url.includes('session_id=') 
        ? url.split('session_id=')[1].split('&')[0] 
        : null;
      
      // Show success and navigate back
      Alert.alert(
        'Payment Successful',
        'Your subscription has been activated successfully!',
        [{ text: 'OK', onPress: () => router.push('/subscription-success') }]
      );
    }
    
    // Check if we've reached the cancel URL
    if (url && url.includes('/payment-cancel')) {
      setWebViewVisible(false);
      setPaymentStatus('cancelled');
      
      // Show cancelled message
      Alert.alert(
        'Payment Cancelled',
        'You have cancelled the payment process.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Barber Pro Subscription</Text>
      <Text style={styles.subtitle}>$29.99/month - Access to all premium features</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {!webViewVisible && paymentStatus === 'initial' && (
        <Button 
          onPress={createPaymentSession}
          title="Subscribe Now"
          loading={loading}
          style={styles.button}
        />
      )}
      
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      
      {webViewVisible && webViewUrl && (
        <View style={styles.webViewContainer}>
          <WebView
            source={{ uri: webViewUrl }}
            style={styles.webView}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading payment page...</Text>
              </View>
            )}
          />
          <Button
            title="Cancel Payment"
            onPress={() => setWebViewVisible(false)}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        </View>
      )}
      
      {paymentStatus === 'success' && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
            Payment successful! Your subscription is now active.
          </Text>
          <Button
            title="Continue"
            onPress={() => router.push('/subscription-success')}
            style={styles.button}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: '#555',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    marginTop: 20,
  },
  webViewContainer: {
    flex: 1,
    marginTop: 20,
  },
  webView: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#ffeeee',
    borderRadius: 8,
    marginVertical: 20,
  },
  errorText: {
    color: 'red',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 10,
  },
  successContainer: {
    padding: 20,
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    color: 'green',
    textAlign: 'center',
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#dc3545',
  },
});

export default WebBasedPayment;