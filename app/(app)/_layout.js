import React from 'react';
import { Stack } from "expo-router";

export default function AppGroupLayout() {
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

