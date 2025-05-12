import { Slot, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';

// Import global CSS files if any, e.g., for fonts
// import '../global.css';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on any screen keeps a back button present where appropriate.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
// This is more relevant if you have a native splash screen configured via app.json
// SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Add any logic here for loading fonts, assets, etc.
  // Then hide splash screen: SplashScreen.hideAsync();

  // useEffect(() => {
  //   // Example: Hide splash screen after some time or when fonts are loaded
  //   // SplashScreen.hideAsync();
  // }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider publishableKey="pk_test_51O9XBtLkdIwK5uPVMOLt5PGqGZ5heXVRDgMY7KMTUZEABKQlQX6HGZCcHsMHHfQDONpLiHIJkQyXNeeNXUSDOUHX00oBRKNsAP">
        {/* 
          You can add global providers here, e.g., AuthProvider, ThemeProvider.
          Make sure they are correctly set up if you uncomment them.
        */}
        {/* <ThemeProvider> */}
        {/*   <AuthProvider> */}
              <Slot />
        {/*   </AuthProvider> */}
        {/* </ThemeProvider> */}
      </StripeProvider>
    </GestureHandlerRootView>
  );
}

