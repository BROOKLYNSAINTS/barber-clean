import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import Constants from 'expo-constants';
import { Button } from '@/components/UIComponents';
import { stripeConfig, stripeBackendUrl } from '@/services/stripeConfig';
import { ScreenContainer, ScreenHeader } from '@/components/LayoutComponents';
import { useRouter } from 'expo-router';

/**
 * A simplified diagnostic screen for Stripe integration issues
 * This version doesn't use the problematic expo-network package
 */
export default function StripeDiagnosticScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState({});
  const [backendStatus, setBackendStatus] = useState({});
  const [configStatus, setConfigStatus] = useState({});
  const [testRequestStatus, setTestRequestStatus] = useState(null);
  
  // Fetch all diagnostic information
  useEffect(() => {
    async function runDiagnostics() {
      try {
        setLoading(true);
        
        // Simple network check
        try {
          const connectivityCheck = await fetch('https://www.google.com/', { 
            method: 'HEAD',
            timeout: 5000
          });
          
          setNetworkStatus({
            connected: true,
            isInternetReachable: connectivityCheck.ok
          });
        } catch (e) {
          setNetworkStatus({
            connected: false,
            isInternetReachable: false
          });
        }
        
        // Check Stripe config
        const config = {
          publishableKeyPresent: !!stripeConfig.publishableKey,
          publishableKeyType: stripeConfig.publishableKey?.startsWith('pk_test_') ? 'TEST' : 'LIVE',
          backendUrlPresent: !!stripeBackendUrl,
          backendUrl: stripeBackendUrl || 'Not configured',
          merchantIdentifierPresent: !!stripeConfig.merchantIdentifier,
          buildType: Constants.expoConfig?.extra?.buildType || 'unknown',
          isTestFlight: Constants.expoConfig?.extra?.isTestFlight || false,
        };
        setConfigStatus(config);
        
        // Check backend
        try {
          const backendUrl = stripeConfig.backendUrl || stripeBackendUrl;
          if (backendUrl) {
            const healthResponse = await fetch(`${backendUrl}/health`);
            const healthData = await healthResponse.json();
            setBackendStatus({
              status: healthResponse.ok ? 'OK' : 'ERROR',
              statusCode: healthResponse.status,
              data: healthData,
              error: null
            });
          } else {
            setBackendStatus({
              status: 'ERROR',
              error: 'No backend URL configured'
            });
          }
        } catch (e) {
          setBackendStatus({
            status: 'ERROR',
            error: e.message
          });
        }
      } catch (e) {
        console.error('Diagnostics error:', e);
      } finally {
        setLoading(false);
      }
    }
    
    runDiagnostics();
  }, []);
  
  // Test payment intent creation
  const testPaymentIntent = async () => {
    setTestRequestStatus({ status: 'loading' });
    try {
      const backendUrl = stripeConfig.backendUrl || stripeBackendUrl;
      if (!backendUrl) {
        throw new Error('No backend URL configured');
      }
      
      const response = await fetch(`${backendUrl}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: 30,
          currency: 'usd',
          description: 'Diagnostic Test',
          service_name: 'Diagnostic Test',
          barber_name: 'Diagnostic User',
          metadata: {
            userId: `diagnostic-${Date.now()}`,
            type: 'test'
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      setTestRequestStatus({
        status: 'success',
        clientSecret: data.clientSecret ? '✓ Present' : '✗ Missing',
        ephemeralKey: data.ephemeralKey ? '✓ Present' : '✗ Missing',
        customer: data.customer ? '✓ Present' : '✗ Missing',
        paymentIntentId: data.paymentIntentId || 'Not returned'
      });
    } catch (e) {
      setTestRequestStatus({
        status: 'error',
        error: e.message
      });
    }
  };
  
  if (loading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Stripe Diagnostics" leftAction={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Running diagnostics...</Text>
        </View>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer>
      <ScreenHeader title="Stripe Diagnostics" leftAction={() => router.back()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Stripe Payment Diagnostics</Text>
        
        {/* Device Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          <Text style={styles.infoText}>Platform: {Platform.OS} {Platform.Version}</Text>
          <Text style={styles.infoText}>App Version: {Constants.expoConfig?.version || 'Unknown'}</Text>
          <Text style={styles.infoText}>Build: {Constants.expoConfig?.ios?.buildNumber || 'Unknown'}</Text>
        </View>
        
        {/* Network Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Status</Text>
          <Text style={[
            styles.statusText, 
            networkStatus.connected ? styles.statusGood : styles.statusBad
          ]}>
            {networkStatus.connected ? '✓ Connected' : '✗ Disconnected'}
          </Text>
          <Text style={styles.infoText}>Internet: {
            networkStatus.isInternetReachable === true ? '✓ Reachable' : 
            networkStatus.isInternetReachable === false ? '✗ Not reachable' : 'Unknown'
          }</Text>
        </View>
        
        {/* Configuration Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stripe Configuration</Text>
          <Text style={[
            styles.statusText, 
            configStatus.publishableKeyPresent ? styles.statusGood : styles.statusBad
          ]}>
            {configStatus.publishableKeyPresent ? 
              `✓ ${configStatus.publishableKeyType} Key Present` : 
              '✗ No API Key'}
          </Text>
          <Text style={[
            styles.statusText,
            configStatus.backendUrlPresent ? styles.statusGood : styles.statusBad
          ]}>
            {configStatus.backendUrlPresent ? '✓ Backend URL Configured' : '✗ No Backend URL'}
          </Text>
          <Text style={styles.infoText}>Backend: {configStatus.backendUrl}</Text>
          <Text style={styles.infoText}>Build Type: {configStatus.buildType}</Text>
          <Text style={styles.infoText}>TestFlight: {configStatus.isTestFlight ? 'Yes' : 'No'}</Text>
        </View>
        
        {/* Backend Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backend Status</Text>
          <Text style={[
            styles.statusText, 
            backendStatus.status === 'OK' ? styles.statusGood : styles.statusBad
          ]}>
            {backendStatus.status === 'OK' ? '✓ Backend Available' : '✗ Backend Issue'}
          </Text>
          {backendStatus.error ? (
            <Text style={styles.errorText}>{backendStatus.error}</Text>
          ) : (
            <Text style={styles.infoText}>
              Status Code: {backendStatus.statusCode || 'Unknown'}
            </Text>
          )}
        </View>
        
        {/* Test Payment Intent */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Payment Intent</Text>
          <Button 
            title="Test Create Payment Intent" 
            onPress={testPaymentIntent}
            disabled={testRequestStatus?.status === 'loading'}
            style={styles.button}
          />
          
          {testRequestStatus && (
            <View style={styles.testResults}>
              {testRequestStatus.status === 'loading' && (
                <ActivityIndicator size="small" color="#0000ff" />
              )}
              
              {testRequestStatus.status === 'success' && (
                <>
                  <Text style={styles.successText}>✓ API Request Successful</Text>
                  <Text style={styles.infoText}>Client Secret: {testRequestStatus.clientSecret}</Text>
                  <Text style={styles.infoText}>Ephemeral Key: {testRequestStatus.ephemeralKey}</Text>
                  <Text style={styles.infoText}>Customer: {testRequestStatus.customer}</Text>
                  <Text style={styles.infoText}>Intent ID: {testRequestStatus.paymentIntentId}</Text>
                </>
              )}
              
              {testRequestStatus.status === 'error' && (
                <>
                  <Text style={styles.errorText}>✗ API Request Failed</Text>
                  <Text style={styles.errorText}>{testRequestStatus.error}</Text>
                </>
              )}
            </View>
          )}
        </View>
        
        {/* Troubleshooting Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Troubleshooting Tips</Text>
          <Text style={styles.tipText}>1. Ensure your API keys match the environment (test/live)</Text>
          <Text style={styles.tipText}>2. Verify backend URL is correct and accessible</Text>
          <Text style={styles.tipText}>3. Check that required parameters are sent to the API</Text>
          <Text style={styles.tipText}>4. Verify the Stripe account is active and not restricted</Text>
          <Text style={styles.tipText}>5. For TestFlight builds, ensure the correct environment is used</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusGood: {
    color: 'green',
  },
  statusBad: {
    color: 'red',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    marginBottom: 5,
  },
  successText: {
    color: 'green',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  button: {
    marginVertical: 10,
  },
  testResults: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tipText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
    lineHeight: 18,
  },
});