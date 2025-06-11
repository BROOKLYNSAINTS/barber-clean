import { useEffect } from 'react';
import { router } from 'expo-router';

import { Redirect } from 'expo-router';

export default function Index() {


  
  useEffect(() => {
  const timeout = setTimeout(() => {
    router.replace('/(auth)/login');
  }, 50); // Give router time to mount
  return () => clearTimeout(timeout);
}, []);

  return <Redirect href="/(auth)/login" />;
}
