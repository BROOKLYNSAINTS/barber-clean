import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Services' }} />
      <Stack.Screen name="appointment" options={{ title: 'Select Time' }} />
      <Stack.Screen name="confirmation" options={{ title: 'Confirmation', headerShown: false }} />
      <Stack.Screen name="logout" options={{ headerShown: false }} />
    </Stack>
  );
}
