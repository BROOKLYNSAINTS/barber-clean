// BackgroundService.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import {
  registerBackgroundTask,
  unregisterBackgroundTask,
  isBackgroundTaskRegistered,
  getBackgroundFetchStatus,
  getLastBackgroundSyncTime
} from './BackgroundTasks';

const BackgroundService = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [status, setStatus] = useState({ available: false, message: 'Checking...' });
  const [lastSync, setLastSync] = useState(null);

  // Check background task status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  // Function to check background task status
  const checkStatus = async () => {
    // Check if background fetch is available
    const backgroundStatus = await getBackgroundFetchStatus();
    setStatus(backgroundStatus);

    // Check if task is registered
    const taskRegistered = await isBackgroundTaskRegistered();
    setIsRegistered(taskRegistered);

    // Get last sync time
    const lastSyncTime = await getLastBackgroundSyncTime();
    setLastSync(lastSyncTime);
  };

  // Toggle background task registration
  const toggleBackgroundTask = async (value) => {
    if (value) {
      // Register the task
      await registerBackgroundTask();
    } else {
      // Unregister the task
      await unregisterBackgroundTask();
    }
    
    // Update status
    await checkStatus();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Background Service</Text>
      
      {/* Status */}
      <View style={styles.row}>
        <Text style={styles.label}>Status:</Text>
        <Text style={[
          styles.value,
          { color: status.available ? '#28a745' : '#dc3545' }
        ]}>
          {status.message}
        </Text>
      </View>
      
      {/* Toggle */}
      {status.available && (
        <View style={styles.row}>
          <Text style={styles.label}>Background Service:</Text>
          <Switch
            value={isRegistered}
            onValueChange={toggleBackgroundTask}
            disabled={!status.available}
          />
        </View>
      )}
      
      {/* Last Sync */}
      {isRegistered && lastSync && (
        <View style={styles.row}>
          <Text style={styles.label}>Last Sync:</Text>
          <Text style={styles.value}>{new Date(lastSync).toLocaleString()}</Text>
        </View>
      )}
      
      {/* Refresh Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={checkStatus}
      >
        <Text style={styles.buttonText}>Refresh Status</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default BackgroundService;