import React, { useState, useEffect } from 'react';
import { Stack } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { listenToAuthChanges } from '@/services/firebase';
import { AuthProvider } from '@/contexts/AuthContext';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,      // ✅ display alert
    shouldPlaySound: false,
    shouldSetBadge: false,      // leave system badge off (we'll manage it in tab UI)
  }),
});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}

export function Layout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
export function AppGroupLayout() {
  // This layout defines the (app) group, which contains routes accessible after authentication.
  // It uses a Stack navigator, allowing navigation to sub-groups like (customer) and (barber).
  // The headerShown is false because child layouts (customer tabs, barber tabs) will manage their own headers or be part of a tab structure.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(barber)" />
      {/* You could have an app/index.js screen here for role selection or as a default landing page within (app) */}
      {/* <Stack.Screen name="index" options={{ title: 'App Home' }} /> */}
    </Stack>
  );
}

