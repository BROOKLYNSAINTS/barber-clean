import { Redirect } from 'expo-router';

export default function Index() {
  console.log('🔄 Index redirect to login screen');
  return <Redirect href="/(auth)/login" />;
}
