// app/_layout.js
import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from '../src/contexts/AuthContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';

// Get the real Stripe key
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY;

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
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier="merchant.com.barberapp"
      >
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}