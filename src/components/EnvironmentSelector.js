// src/components/EnvironmentSelector.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Switch, 
  Modal,
  ScrollView
} from 'react-native';
import { 
  useProductionDb, 
  setUseProductionDatabase, 
  simulateTestFlight,
  setSimulateTestFlight,
  simulateAppStore,
  setSimulateAppStore
} from '../services/firebaseEnvironment';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * An enhanced environment selector component that allows testing all environments
 * This should only be used during development
 */
export default function EnvironmentSelector() {
  const [useProductionDb, setUseProductionDb] = useState(false);
  const [testFlightSimulation, setTestFlightSimulation] = useState(false);
  const [appStoreSimulation, setAppStoreSimulation] = useState(false);
  const [visible, setVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Load the saved preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedProductionDb = await AsyncStorage.getItem('useProductionDatabase');
        const savedTestFlightSim = await AsyncStorage.getItem('simulateTestFlight');
        const savedAppStoreSim = await AsyncStorage.getItem('simulateAppStore');
        
        setUseProductionDb(savedProductionDb === 'true');
        setTestFlightSimulation(savedTestFlightSim === 'true');
        setAppStoreSimulation(savedAppStoreSim === 'true');
      } catch (error) {
        console.warn('Could not load saved environment preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);

  // Toggle which database to use
  const toggleDatabase = async (value) => {
    setUseProductionDb(value);
    setTestFlightSimulation(false);
    setAppStoreSimulation(false);
    await setUseProductionDatabase(value);
    reloadApp();
  };
  
  // Toggle TestFlight simulation
  const toggleTestFlight = async (value) => {
    setTestFlightSimulation(value);
    setUseProductionDb(false);
    setAppStoreSimulation(false);
    await setSimulateTestFlight(value);
    reloadApp();
  };
  
  // Toggle App Store simulation
  const toggleAppStore = async (value) => {
    setAppStoreSimulation(value);
    setUseProductionDb(false);
    setTestFlightSimulation(false);
    await setSimulateAppStore(value);
    reloadApp();
  };
  
  // Helper to reload the app
  const reloadApp = () => {
    // Show alert before reloading
    alert('Changing environment settings. The app will reload now.');
    
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

  // Show help modal with detailed information
  const showHelp = () => {
    setModalVisible(true);
  };

  if (!__DEV__) {
    // Don't show this component in production builds
    return null;
  }

  // Get current environment name for the toggle button
  let currentEnv = 'TEST DB';
  if (appStoreSimulation) {
    currentEnv = 'APP STORE';
  } else if (testFlightSimulation) {
    currentEnv = 'TESTFLIGHT';
  } else if (useProductionDb) {
    currentEnv = 'PROD DB';
  }

  return (
    <View style={styles.container}>
      {visible ? (
        <View style={styles.selectorContainer}>
          <Text style={styles.title}>Environment Selector</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>
              Use Production Database
            </Text>
            <Switch
              value={useProductionDb}
              onValueChange={toggleDatabase}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={useProductionDb ? '#2196F3' : '#f4f3f4'}
              disabled={testFlightSimulation || appStoreSimulation}
            />
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Environment Simulation</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>
              Simulate TestFlight
            </Text>
            <Switch
              value={testFlightSimulation}
              onValueChange={toggleTestFlight}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={testFlightSimulation ? '#2196F3' : '#f4f3f4'}
              disabled={useProductionDb || appStoreSimulation}
            />
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>
              Simulate App Store
            </Text>
            <Switch
              value={appStoreSimulation}
              onValueChange={toggleAppStore}
              trackColor={{ false: '#767577', true: '#F57F17' }}
              thumbColor={appStoreSimulation ? '#F57F17' : '#f4f3f4'}
              disabled={useProductionDb || testFlightSimulation}
            />
          </View>
          
          <Text style={styles.helpText}>
            {getEnvironmentDescription(useProductionDb, testFlightSimulation, appStoreSimulation)}
          </Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.helpButton]} 
              onPress={showHelp}
            >
              <Text style={styles.buttonText}>Help</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.closeButton]} 
              onPress={() => setVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={[
            styles.toggleButton, 
            appStoreSimulation ? styles.appStoreToggle : 
            testFlightSimulation ? styles.testFlightToggle : 
            useProductionDb ? styles.productionToggle : styles.testToggle
          ]} 
          onPress={() => setVisible(true)}
        >
          <Text style={styles.toggleText}>
            {currentEnv}
          </Text>
        </TouchableOpacity>
      )}
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Environment Testing Guide</Text>
            
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalSectionTitle}>Test Database</Text>
              <Text style={styles.modalText}>
                • Default development environment{'\n'}
                • Uses barber-38b88 Firebase project{'\n'}
                • For daily development and testing{'\n'}
                • Same database used in TestFlight builds
              </Text>
              
              <Text style={styles.modalSectionTitle}>Production Database</Text>
              <Text style={styles.modalText}>
                • Uses barberapp-prod-2d197 Firebase project{'\n'}
                • Test your app against production data{'\n'}
                • Verify production API keys work{'\n'}
                • Use before submitting to App Store
              </Text>
              
              <Text style={styles.modalSectionTitle}>Simulate TestFlight</Text>
              <Text style={styles.modalText}>
                • Mimics TestFlight environment behavior{'\n'}
                • Forces use of test database{'\n'}
                • Helpful to test TestFlight configuration{'\n'}
                • Verifies correct database is used
              </Text>
              
              <Text style={styles.modalSectionTitle}>Simulate App Store</Text>
              <Text style={styles.modalText}>
                • Mimics App Store release behavior{'\n'}
                • Forces use of production database{'\n'}
                • Critical for testing production config{'\n'}
                • Use this to validate App Store experience
              </Text>
              
              <Text style={styles.modalSectionTitle}>Best Practices</Text>
              <Text style={styles.modalText}>
                1. Develop using Test Database{'\n'}
                2. Before TestFlight, test with Simulate TestFlight{'\n'}
                3. Before App Store, test with Simulate App Store{'\n'}
                4. Create test users in both databases
              </Text>
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.button, styles.closeButton, {alignSelf: 'center', marginTop: 10}]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper function to get description text based on current settings
function getEnvironmentDescription(useProductionDb, testFlightSimulation, appStoreSimulation) {
  if (appStoreSimulation) {
    return 'Simulating App Store release environment (barberapp-prod-2d197)';
  } else if (testFlightSimulation) {
    return 'Simulating TestFlight environment (barber-38b88)';
  } else if (useProductionDb) {
    return 'Using Production Database (barberapp-prod-2d197)';
  } else {
    return 'Using Test Database (barber-38b88)';
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  testToggle: {
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
  },
  productionToggle: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  testFlightToggle: {
    backgroundColor: 'rgba(156, 39, 176, 0.8)',
  },
  appStoreToggle: {
    backgroundColor: 'rgba(245, 127, 23, 0.8)',
  },
  toggleText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
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
    width: 280,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 5,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  closeButton: {
    backgroundColor: '#2196F3',
  },
  helpButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: '#2196F3',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
});
