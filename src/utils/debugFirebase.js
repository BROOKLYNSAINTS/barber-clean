// src/utils/debugFirebase.js
import firebaseConfig from '../services/firebaseEnvironment';
import { getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

export function logFirebaseConfig() {
  console.log('📱 ========= FIREBASE CONFIG DEBUG =========');
  console.log('🔑 API Key:', firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 5)}...` : 'MISSING');
  console.log('🌐 Auth Domain:', firebaseConfig.authDomain || 'MISSING');
  console.log('🏗️ Project ID:', firebaseConfig.projectId || 'MISSING');
  console.log('💾 Storage Bucket:', firebaseConfig.storageBucket ? 'PRESENT' : 'MISSING');
  console.log('📨 Messaging ID:', firebaseConfig.messagingSenderId ? 'PRESENT' : 'MISSING');
  console.log('🆔 App ID:', firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 8)}...` : 'MISSING');
  console.log('📊 Measurement ID:', firebaseConfig.measurementId ? 'PRESENT' : 'MISSING');
  
  // Check Firebase initialization status
  const apps = getApps();
  console.log('🔄 Firebase Apps Initialized:', apps.length);
  
  // Environment info
  console.log('🏠 Environment:', __DEV__ ? 'Development' : 'Production');
  console.log('📱 Platform:', Platform.OS, Platform.Version);
  
  // Check auth state if Firebase is initialized
  if (apps.length > 0) {
    try {
      const app = getApp();
      const auth = getAuth(app);
      console.log('🔒 Auth Instance:', auth ? 'Available' : 'Not available');
      console.log('👤 Current User:', auth.currentUser ? 'Signed In' : 'Not Signed In');
    } catch (error) {
      console.error('❌ Error accessing Firebase Auth:', error);
    }
  }
  
  console.log('========================================');
}

// Add more detailed Firebase diagnostics
export function logAuthState() {
  try {
    const apps = getApps();
    if (apps.length === 0) {
      console.log('❌ No Firebase apps initialized');
      return;
    }
    
    const app = getApp();
    const auth = getAuth(app);
    
    console.log('🔍 Auth State Check:');
    console.log('- Auth initialized:', !!auth);
    console.log('- Current user:', auth.currentUser ? `ID: ${auth.currentUser.uid}` : 'No user');
    
    if (auth.currentUser) {
      console.log('- Email:', auth.currentUser.email);
      console.log('- Email verified:', auth.currentUser.emailVerified);
      console.log('- Provider data:', JSON.stringify(auth.currentUser.providerData));
    }
  } catch (error) {
    console.error('❌ Auth state check error:', error);
  }
}
