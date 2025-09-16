// This is a fallback entry point for iOS TestFlight builds
import { registerRootComponent } from 'expo';
import { LogBox, AppRegistry } from 'react-native';

// Disable yellow warnings
LogBox.ignoreAllLogs();

// Import our login screen
import LoginScreen from './app/(auth)/login';
import { AuthProvider } from './src/contexts/AuthContext';

// Wrap LoginScreen in AuthProvider
function RootComponent() {
  return (
    <AuthProvider>
      <LoginScreen directEntry={true} />
    </AuthProvider>
  );
}

// Register as the main component
registerRootComponent(RootComponent);

// Also register using AppRegistry as a fallback
AppRegistry.registerComponent('main', () => RootComponent);
