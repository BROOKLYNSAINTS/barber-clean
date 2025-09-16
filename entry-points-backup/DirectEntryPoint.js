import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, LogBox, Platform, AppState, BackHandler } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/contexts/AuthContext';

// Import the login screen directly
import LoginScreen from './app/(auth)/login';

// Disable yellow warnings
LogBox.ignoreAllLogs();

export default function DirectEntryPoint() {
  useEffect(() => {
    // Immediately attempt to hide splash screen
    SplashScreen.hideAsync().catch(e => console.log("Failed to hide splash screen:", e));
    
    // Force status bar to be visible and with correct style
    StatusBar.setHidden(false);
    StatusBar.setBarStyle('dark-content');
    
    // For Android, handle back button to prevent exit
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => backHandler.remove();
    }
    
    // Also try to hide splash screen after a delay
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  console.log("🚀 Direct Entry Point Rendering");

  // Render the login screen directly without routing, wrapped in AuthProvider
  return (
    <AuthProvider>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <LoginScreen directEntry={true} />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
});
