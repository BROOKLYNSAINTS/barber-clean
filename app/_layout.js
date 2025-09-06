import { Stack } from "expo-router";
import 'react-native-reanimated/plugin'
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}