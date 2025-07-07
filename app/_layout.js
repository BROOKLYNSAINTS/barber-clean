// app/_layout.js
import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from '../src/contexts/AuthContext'; // adjust if needed
import { StripeProvider } from '@stripe/stripe-react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StripeProvider
        publishableKey="pk_test_dummyKeyForDemoPurposesOnly"
        merchantIdentifier="merchant.com.barberapp"
      >
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}