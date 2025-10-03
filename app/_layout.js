import 'react-native-gesture-handler';
import React, { useEffect, useCallback, useState } from 'react';
import { Stack, Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { auth, db } from '@/services/firebase'; // Make sure this import is correct
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Platform, Alert, Linking } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import * as Notifications from 'expo-notifications';
import { updateStripeConnectStatus } from '@/services/firebase';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});


// Only modify the font loading part to handle simulator quirks

export default function Layout() {
  const [user, setUser] = useState(null);
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Black': require('../assets/fonts/Inter-Black.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
  });
  const router = useRouter();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event.url;
      console.log('🔗 Deep link received:', url);
      
      if (url.includes('stripe-connect-return')) {
        console.log('🔄 Stripe Connect return detected');
        
        // Check if user is logged in
        if (auth.currentUser) {
          try {
            console.log('✅ User authenticated, updating Stripe Connect status');
            // Update the Stripe Connect status in Firestore
            await updateStripeConnectStatus(auth.currentUser.uid);
            
            console.log('🏠 Redirecting to dashboard');
            // Redirect to dashboard
            router.replace('/(barber)/dashboard');
          } catch (error) {
            console.error('❌ Error updating Stripe Connect status:', error);
            Alert.alert('Error', 'There was a problem updating your payment account status.');
          }
        } else {
          console.log('❌ User not authenticated on return from Stripe');
          // Handle unauthenticated state - redirect to login
          router.replace('/login');
        }
      }
    };

    // Set up the event listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Also check if app was opened with a deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('App opened with URL:', url);
        handleDeepLink({ url });
      }
    });
    
    return () => {
      // Clean up the event listener
      subscription.remove();
    };
  }, []);

  // Hide the splash screen once fonts are loaded or there's an error
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Add simulator-specific fallback
  useEffect(() => {
    // Force proceed after a short delay in simulator
    const timer = setTimeout(() => {
      console.log('⏱️ Font loading timeout - forcing app to continue');
      SplashScreen.hideAsync().catch(e => {});
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.log('Splash screen already hidden');
      }
    }
  }, [fontsLoaded, fontError]);

  // For simulator only: continue after a very short delay regardless of fonts
  const isSimulator = Platform.OS === 'ios' && !Platform.isPad && !Platform.isTVOS;
  if (!fontsLoaded && !fontError && isSimulator) {
    setTimeout(() => {
      SplashScreen.hideAsync().catch(e => {});
    }, 1000);
  }
  
  // Standard check for font loading
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </GestureHandlerRootView>
      </AuthProvider>
    </SafeAreaProvider>
  );
}