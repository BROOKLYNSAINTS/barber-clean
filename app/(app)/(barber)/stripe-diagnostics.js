import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { auth } from '@/services/firebase';
import { stripeConfig, stripeBackendUrl } from '@/services/stripeConfig';
import Logger from '@/utils/debugLogger';
import { useRouter } from 'expo-router';

export default function StripeDiagnostics() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [backendStatus, setBackendStatus] = useState('unknown');
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);
  const [stripeKeys, setStripeKeys] = useState({
    publishableKey: '',
    keyType: '',
    backend: ''
  });

  useEffect(() => {
    getEnvironmentInfo();
    checkBackendStatus();
  }, []);

  // Add a log entry
  const addLog = (message, details = null, type = 'info') => {
    const timestamp = new Date().toISOString();
    setLogs(prevLogs => [
      { id: Date.now(), timestamp, message, details, type },
      ...prevLogs
    ]);
  };

  // Get environment information
  const getEnvironmentInfo = () => {
    try {
      const buildType = Constants.expoConfig?.extra?.buildType || 'unknown';
      const isTestFlight = Constants.expoConfig?.extra?.isTestFlight || false;
      
      const publishableKey = stripeConfig.publishableKey || 'unknown';
      const keyType = publishableKey.startsWith('pk_test') ? 'TEST' : 'PRODUCTION';
      
      setStripeKeys({
        publishableKey: publishableKey.substring(0, 8) + '...' + publishableKey.substring(publishableKey.length - 4),
        keyType,
        backend: stripeBackendUrl
      });
      
      addLog('Environment information', {
        buildType,
        isTestFlight,
        deviceInfo: `${Device.osName || 'unknown'} ${Device.osVersion || 'unknown'}`,
        stripeKeyType: keyType
      });
      
    } catch (error) {
      addLog('Failed to get environment info', { error: error.message }, 'error');
    }
  };

  // Check backend health
  const checkBackendStatus = async () => {
    try {
      setIsLoadingBackend(true);
      addLog('Checking backend status', { url: stripeBackendUrl });
      
      const response = await fetch(`${stripeBackendUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackendStatus('online');
        addLog('Backend is online', data, 'success');
      } else {
        setBackendStatus('error');
        addLog('Backend error response', { status: response.status }, 'error');
      }
    } catch (error) {
      setBackendStatus('offline');
      addLog('Backend unreachable', { error: error.message }, 'error');
    } finally {
      setIsLoadingBackend(false);
    }
  };

  // Test create payment intent
  const testPaymentIntent = async () => {
    try {
      addLog('Testing payment intent creation', { url: `${stripeBackendUrl}/api/create-payment-intent` });
      
      // Get user ID or use test user ID
      const userId = auth.currentUser?.uid || 'test-user-' + Date.now();
      
      // Create a small test payment intent
      const response = await fetch(`${stripeBackendUrl}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1, // $1.00 for testing
          currency: 'usd',
          description: 'Diagnostic Test Payment',
          metadata: {
            userId,
            type: 'diagnostic_test',
            environment: Constants.expoConfig?.extra?.buildType || 'unknown',
            timestamp: new Date().toISOString()
          }
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addLog('Payment intent created successfully', {
          paymentIntentId: data.paymentIntentId,
          clientSecretFormat: data.clientSecret ? 'Valid format' : 'Invalid format',
          hasEphemeralKey: !!data.ephemeralKey,
          hasCustomer: !!data.customer,
          mode: data.mode
        }, 'success');
        
        // Check client secret format
        if (data.clientSecret) {
          const clientSecretParts = data.clientSecret.split('_');
          if (clientSecretParts.length >= 3) {
            addLog('Client secret format looks valid', {
              prefix: clientSecretParts[0],
              type: clientSecretParts[0] === 'pi' ? 'PaymentIntent' : 
                    clientSecretParts[0] === 'seti' ? 'SetupIntent' : 'Unknown'
            }, 'success');
          } else {
            addLog('Client secret format is invalid', {
              format: data.clientSecret.substring(0, 10) + '...'
            }, 'error');
          }
        }
        
        return data;
      } else {
        addLog('Payment intent creation failed', {
          status: response.status,
          error: data.error || 'Unknown error'
        }, 'error');
        throw new Error(data.error || 'Failed to create payment intent');
      }
    } catch (error) {
      addLog('Error in payment intent test', { 
        message: error.message,
        name: error.name
      }, 'error');
      
      Alert.alert('Test Failed', `Could not create payment intent: ${error.message}`);
    }
  };

  // Check API compatibility
  const checkApiCompatibility = async () => {
    try {
      addLog('Checking Stripe API compatibility');
      
      const clientInfo = {
        publishableKey: stripeConfig.publishableKey,
        apiVersion: '2023-10-16', // Current version used by stripe-react-native
        sdkName: '@stripe/stripe-react-native'
      };
      
      // This is where we would check API version compatibility
      // Since we don't have direct access to backend version, we'll just use the health check
      
      const backendCheck = await fetch(`${stripeBackendUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (backendCheck.ok) {
        addLog('API compatibility check', {
          clientApiVersion: '2023-10-16',
          backendStatus: 'online',
          recommendation: 'Ensure backend uses Stripe API v2023-10-16 or compatible'
        }, 'info');
      } else {
        addLog('API compatibility check failed - backend unreachable', {}, 'warning');
      }
      
    } catch (error) {
      addLog('API compatibility check error', { error: error.message }, 'error');
    }
  };

  const renderLogEntry = (log) => {
    let backgroundColor = '#f5f5f5';
    let textColor = '#333';
    let icon = 'information-circle';
    
    switch(log.type) {
      case 'success':
        backgroundColor = '#e8f5e9';
        textColor = '#2e7d32';
        icon = 'checkmark-circle';
        break;
      case 'error':
        backgroundColor = '#ffebee';
        textColor = '#c62828';
        icon = 'alert-circle';
        break;
      case 'warning':
        backgroundColor = '#fff8e1';
        textColor = '#f57f17';
        icon = 'warning';
        break;
    }
    
    return (
      <View key={log.id} style={[styles.logEntry, { backgroundColor }]}>
        <View style={styles.logHeader}>
          <Ionicons name={icon} size={16} color={textColor} />
          <Text style={[styles.logMessage, { color: textColor }]}>{log.message}</Text>
        </View>
        
        <Text style={styles.logTimestamp}>
          {new Date(log.timestamp).toLocaleTimeString()}
        </Text>
        
        {log.details && (
          <Text style={styles.logDetails}>
            {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stripe Diagnostics</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Stripe Configuration Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stripe Configuration</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Key Type:</Text>
              <Text style={[
                styles.infoValue, 
                { color: stripeKeys.keyType === 'TEST' ? '#FF9800' : '#4CAF50' }
              ]}>
                {stripeKeys.keyType}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Publishable Key:</Text>
              <Text style={styles.infoValue}>{stripeKeys.publishableKey}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Backend URL:</Text>
              <Text style={styles.infoValue}>{stripeKeys.backend}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Backend Status:</Text>
              <View style={[
                styles.statusBadge,
                backendStatus === 'online' ? styles.statusOnline :
                backendStatus === 'offline' ? styles.statusOffline :
                backendStatus === 'error' ? styles.statusError :
                styles.statusUnknown
              ]}>
                <Text style={styles.statusBadgeText}>
                  {backendStatus === 'online' ? 'Online' :
                   backendStatus === 'offline' ? 'Offline' :
                   backendStatus === 'error' ? 'Error' : 'Unknown'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Diagnostic Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnostic Tests</Text>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={checkBackendStatus}
              disabled={isLoadingBackend}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {isLoadingBackend ? 'Checking...' : 'Check Backend Status'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={testPaymentIntent}
            >
              <Ionicons name="card" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Test Payment Intent</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={checkApiCompatibility}
            >
              <Ionicons name="code-slash" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Check API Compatibility</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Common Issues */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Issues</Text>
          
          <View style={styles.issueCard}>
            <Text style={styles.issueTitle}>Client Secret Format Error</Text>
            <Text style={styles.issueDescription}>
              The "Failed 'secret' format does not match expected client secret formatting" error typically occurs when:
            </Text>
            <View style={styles.bulletPoints}>
              <Text style={styles.bulletPoint}>• The backend is returning an invalid client secret format</Text>
              <Text style={styles.bulletPoint}>• Stripe API versions mismatch between frontend and backend</Text>
              <Text style={styles.bulletPoint}>• Backend server is not responding correctly</Text>
              <Text style={styles.bulletPoint}>• Stripe keys mismatch (using test key with production backend)</Text>
            </View>
          </View>
        </View>
        
        {/* Debug Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Logs</Text>
          
          <View style={styles.logsContainer}>
            {logs.length > 0 ? (
              logs.map(renderLogEntry)
            ) : (
              <Text style={styles.noLogsText}>No logs available. Run diagnostics to generate logs.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOnline: {
    backgroundColor: '#4CAF50',
  },
  statusOffline: {
    backgroundColor: '#F44336',
  },
  statusError: {
    backgroundColor: '#FF9800',
  },
  statusUnknown: {
    backgroundColor: '#9E9E9E',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  issueCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  issueDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
  bulletPoints: {
    marginLeft: 4,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    lineHeight: 20,
  },
  logsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    maxHeight: 400,
  },
  logEntry: {
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  logTimestamp: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  logDetails: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#555',
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 8,
    borderRadius: 4,
  },
  noLogsText: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});