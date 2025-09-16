import React from 'react';
import { Stack } from 'expo-router';
import StripeTestScreen from '@/components/StripeTestScreen';

export default function StripeTestRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Stripe TestFlight Test',
          headerStyle: {
            backgroundColor: '#4a148c',
          },
          headerTintColor: '#fff',
        }}
      />
      <StripeTestScreen />
    </>
  );
}