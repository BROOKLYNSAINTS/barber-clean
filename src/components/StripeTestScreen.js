/**
 * Stripe Test Component
 * This component can be added to your app to test Stripe integration in TestFlight
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import Stripe services
import stripeService from '@/services/stripe';
import { stripeConfig, stripeBackendUrl } from '@/services/stripeConfig';
import Logger from '@/utils/debugLogger';

const StripeTestScreen = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [environment, setEnvironment] = useState({});
  
  // Get environment information when component mounts
  useEffect(() => {
    const getEnvironmentInfo = async () => {
      try {
        const env = {
          buildType: Constants.expoConfig?.extra?.buildType || 'unknown',
          isTestFlight: Constants.expoConfig?.extra?.isTestFlight || false,
          appVersion: Application.nativeApplicationVersion || 'unknown',
          buildNumber: Application.nativeBuildVersion || 'unknown',
          platform: Device.osName,
          osVersion: Device.osVersion,
          deviceModel: Device.modelName || 'unknown',
          stripePublishableKey: stripeConfig.publishableKey.substring(0, 10) + '...',
          stripeKeyType: stripeConfig.publishableKey.startsWith('pk_test') ? 'TEST' : 'PRODUCTION',
          stripeBackendUrl: stripeBackendUrl
        };
        
        setEnvironment(env);
        addLog('Environment loaded', env);
        
        // Log environment
        Logger.logEnvironment('StripeTest');
      } catch (error) {
        addLog('Error getting environment', { error: error.message });
      }
    };
    
    getEnvironmentInfo();
    
    // Initialize Stripe
    initStripe();
  }, []);
  
  // Helper to add logs
  const addLog = (message, data = null) => {
    const timestamp = new Date().toISOString();
    setLogs(prevLogs => [
      { id: Date.now(), timestamp, message, data },
      ...prevLogs
    ]);
  };
  
  // Initialize Stripe
  const initStripe = async () => {
    try {
      addLog('Initializing Stripe...');
      setLoading(true);
      
      await stripeService.initializeStripe();
      
      addLog('Stripe initialized successfully', {
        keyType: stripeConfig.publishableKey.startsWith('pk_test') ? 'TEST' : 'PRODUCTION',
        merchantId: stripeConfig.merchantIdentifier,
        urlScheme: stripeConfig.urlScheme
      });
      
    } catch (error) {
      addLog('Error initializing Stripe', { 
        error: error.message,
        code: error.code
      });
      Alert.alert('Error', `Failed to initialize Stripe: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Test simple payment
  const testPayment = async () => {
    try {
      addLog('Starting test payment...');
      setLoading(true);
      
      // Generate unique IDs for testing
      const testUserId = `test_user_${Date.now()}`;
      const testBarberId = `test_barber_${Date.now()}`;
      const testAppointmentId = `test_appt_${Date.now()}`;
      
      // Use a small amount for testing
      const amount = 1; // $1.00
      
      addLog('Creating payment intent', {
        userId: testUserId,
        barberId: testBarberId,
        appointmentId: testAppointmentId,
        amount
      });
      
      const result = await stripeService.createAndPresentServicePaymentSheet(
        testUserId,
        testBarberId,
        testAppointmentId,
        amount,
        'TestFlight Payment Test'
      );
      
      addLog('Payment result', result);
      
      if (result.success) {
        Alert.alert('Success', `Payment successful! ID: ${result.paymentIntentId}`);
      } else if (result.canceled) {
        addLog('Payment was canceled by user');
        Alert.alert('Canceled', 'Payment was canceled');
      }
      
    } catch (error) {
      addLog('Payment error', { 
        message: error.message,
        code: error.code,
        type: error.type
      });
      
      Alert.alert('Payment Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Test subscription payment
  const testSubscription = async () => {
    try {
      addLog('Starting subscription test...');
      setLoading(true);
      
      // Generate unique ID for testing
      const testUserId = `test_user_${Date.now()}`;
      
      // Use the actual subscription price ID from profile-setup.js
      const BARBER_SUBSCRIPTION_PRICE_ID = 'price_1S745Z4MureyHjXxccRvACTI';
      
      addLog('Using production price ID', {
        priceId: BARBER_SUBSCRIPTION_PRICE_ID,
        userId: testUserId
      });
      
      // Log detailed environment info to help diagnose issues
      Logger.logEnvironment('StripeTest');
      Logger.info('StripeTest', 'Starting subscription test', {
        userId: testUserId,
        priceId: BARBER_SUBSCRIPTION_PRICE_ID,
        environment: Constants.expoConfig?.extra?.buildType || 'unknown',
        isTestFlight: Constants.expoConfig?.extra?.isTestFlight || false
      });
      
      // Add a delay to help with debugging by separating log groups
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Attempt to create the subscription
      const subscriptionResult = await stripeService.createSubscriptionPaymentSheet(
        testUserId, 
        BARBER_SUBSCRIPTION_PRICE_ID
      );
      
      addLog('Subscription result', subscriptionResult);
      
      if (subscriptionResult.success) {
        addLog('Subscription created successfully', {
          subscriptionId: subscriptionResult.subscriptionId,
          paymentIntentId: subscriptionResult.paymentIntentId
        });
        
        Alert.alert(
          'Success!', 
          `Subscription created successfully!\n\nSubscription ID: ${subscriptionResult.subscriptionId.substring(0, 10)}...`
        );
      } else if (subscriptionResult.canceled) {
        addLog('Subscription setup canceled by user');
        Alert.alert('Canceled', 'Subscription setup was canceled by the user');
      } else {
        addLog('Subscription failed without specific error');
        Alert.alert('Error', 'Subscription failed without providing specific error details');
      }
      
    } catch (error) {
      // Log detailed error information
      addLog('Subscription error', { 
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      Logger.error('StripeTest', 'Subscription test failed', error, {
        environment: Constants.expoConfig?.extra?.buildType || 'unknown',
        isTestFlight: Constants.expoConfig?.extra?.isTestFlight || false
      });
      
      Alert.alert('Subscription Error', `Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Stripe Test in TestFlight</Text>
      
      {/* Environment Info */}
      <View style={styles.envContainer}>
        <Text style={styles.sectionTitle}>Environment</Text>
        <Text style={styles.envText}>Build: {environment.buildType} {environment.isTestFlight ? '(TestFlight)' : ''}</Text>
        <Text style={styles.envText}>App: v{environment.appVersion} ({environment.buildNumber})</Text>
        <Text style={styles.envText}>Device: {environment.deviceModel} - {environment.platform} {environment.osVersion}</Text>
        <Text style={styles.envText}>Stripe: {environment.stripeKeyType} ({environment.stripePublishableKey})</Text>
      </View>
      
      {/* Test Actions */}
      <View style={styles.actionContainer}>
        <Button 
          title="Test $1.00 Payment" 
          onPress={testPayment} 
          disabled={loading} 
          color="#1E88E5"
        />
      </View>
      
      <View style={styles.actionContainer}>
        <Button 
          title="Test Subscription" 
          onPress={testSubscription} 
          disabled={loading} 
          color="#9C27B0"
        />
      </View>
      
      <View style={styles.actionContainer}>
        <Button 
          title="Initialize Stripe" 
          onPress={initStripe} 
          disabled={loading}
          color="#43A047"
        />
        <View style={styles.spacer} />
        <Button 
          title="Clear Logs" 
          onPress={clearLogs} 
          disabled={loading}
          color="#757575"
        />
      </View>
      
      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Processing... Check console for detailed logs</Text>
        </View>
      )}
      
      {/* Logs display */}
      <View style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>Logs</Text>
        <ScrollView style={styles.logScroll}>
          {logs.map(log => (
            <View key={log.id} style={styles.logEntry}>
              <Text style={styles.logTimestamp}>{log.timestamp.substring(11, 19)}</Text>
              <Text style={styles.logMessage}>{log.message}</Text>
              {log.data && (
                <Text style={styles.logData}>
                  {JSON.stringify(log.data, null, 2)}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  envContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  envText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  spacer: {
    width: 8,
  },
  loadingContainer: {
    padding: 12,
    backgroundColor: '#FFF9C4',
    borderRadius: 4,
    marginBottom: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#F57F17',
    fontWeight: '500',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  logScroll: {
    flex: 1,
  },
  logEntry: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  logTimestamp: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  logMessage: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  logData: {
    fontSize: 12,
    color: '#555',
    backgroundColor: '#f9f9f9',
    padding: 6,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default StripeTestScreen;