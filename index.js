//import { registerRootComponent } from 'expo';

import App from './app';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
/*import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  useEffect(() => {
    AsyncStorage.clear().then(() => {
      console.log("🧹 AsyncStorage cleared");
    });
  }, []);

  return 
    // your component tree
  
}*/

