import { AppRegistry, Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/contexts/AuthContext';
import LoginScreen from './app/(auth)/login';
import React from 'react';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()
  .then(() => console.log('SplashScreen.preventAutoHideAsync() succeeded'))
  .catch(() => console.log('SplashScreen.preventAutoHideAsync() failed'));

// Simple bare root component that renders the login screen directly
function Root() {
  // Try to hide splash screen on mount
  React.useEffect(() => {
    // Hide splash screen after a short delay
    const timer = setTimeout(() => {
      SplashScreen.hideAsync()
        .then(() => console.log('SplashScreen hidden successfully'))
        .catch(e => console.log('Error hiding splash screen:', e));
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Render login screen directly
  return (
    <AuthProvider>
      <LoginScreen directEntry={true} />
    </AuthProvider>
  );
}

// Register the root component using both methods for maximum compatibility
if (Platform.OS === 'ios') {
  console.log('Registering iOS app entry point');
  AppRegistry.registerComponent('main', () => Root);
} 

// Also register using Expo's method for development
registerRootComponent(Root);

// Log that the entry point has been loaded
console.log('Main entry point loaded successfully');
