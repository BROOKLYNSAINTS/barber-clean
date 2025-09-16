// src/components/DatabaseSelector.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useProductionDb, setUseProductionDatabase } from '../services/firebaseEnvironment';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A component that allows switching between test and production Firebase databases
 * This should only be used during development and testing
 */
export default function DatabaseSelector() {
  const [useProductionDb, setUseProductionDb] = useState(false);
  const [visible, setVisible] = useState(false);

  // Load the saved preference on component mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem('useProductionDatabase');
        setUseProductionDb(savedPreference === 'true');
      } catch (error) {
        console.warn('Could not load saved database preference:', error);
      }
    };
    
    loadPreference();
  }, []);

  // Toggle which database to use
  const toggleDatabase = async (value) => {
    setUseProductionDb(value);
    await setUseProductionDatabase(value);
    
    // Force reload the app to apply changes
    // Note: This is a simple approach - a more sophisticated app might have a proper state management
    // system that would handle this without requiring a reload
    alert(`Switching to ${value ? 'PRODUCTION' : 'TEST'} database. The app will now reload.`);
    
    // Small delay before reload
    setTimeout(() => {
      try {
        // This will only work in Expo development builds
        if (global.Expo && global.Expo.reload) {
          global.Expo.reload();
        } else {
          alert('Please manually reload the app to apply changes');
        }
      } catch (e) {
        alert('Please manually reload the app to apply changes');
      }
    }, 1000);
  };

  if (!__DEV__) {
    // Don't show this component in production builds
    return null;
  }

  return (
    <View style={styles.container}>
      {visible ? (
        <View style={styles.selectorContainer}>
          <Text style={styles.title}>Database Selection</Text>
          <View style={styles.row}>
            <Text style={styles.label}>
              Using {useProductionDb ? 'PRODUCTION' : 'TEST'} Database
            </Text>
            <Switch
              value={useProductionDb}
              onValueChange={toggleDatabase}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={useProductionDb ? '#2196F3' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.helpText}>
            {useProductionDb 
              ? 'Production DB: barberapp-prod-2d197' 
              : 'Test DB: barber-38b88'}
          </Text>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setVisible(false)}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={() => setVisible(true)}
        >
          <Text style={styles.toggleText}>
            {useProductionDb ? 'PROD' : 'TEST'} DB
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  toggleButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  toggleText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectorContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 250,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
