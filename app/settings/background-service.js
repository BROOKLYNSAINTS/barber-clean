// settings/background-service.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import BackgroundService from '../../src/services/BackgroundService';

export default function BackgroundServiceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Background Service Settings' }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Background Service Settings</Text>
        
        <Text style={styles.description}>
          Enable background services to keep your app synchronized and up-to-date even when it's not actively open.
          This allows the app to:
        </Text>
        
        <View style={styles.bulletPoints}>
          <Text style={styles.bullet}>• Receive appointment updates and notifications</Text>
          <Text style={styles.bullet}>• Sync your calendar in the background</Text>
          <Text style={styles.bullet}>• Keep your data current with the server</Text>
          <Text style={styles.bullet}>• Process pending operations</Text>
        </View>
        
        <Text style={styles.note}>
          Note: Enabling background services may slightly increase battery usage. The service runs 
          periodically (about every 15 minutes) and performs quick, efficient operations to keep 
          your data in sync.
        </Text>
        
        <BackgroundService />
        
        <Text style={styles.disclaimer}>
          All background operations comply with Apple and Google's best practices for 
          battery usage and data conservation.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 16,
  },
  bulletPoints: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    color: '#444',
  },
  note: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    marginTop: 24,
    textAlign: 'center',
  },
});