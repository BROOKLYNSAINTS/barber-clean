// src/services/directFirebaseAuth.js
// This is a direct implementation that bypasses the Firebase SDK
// when there's an API key issue
import { Alert, Platform } from 'react-native';
import firebaseConfig from './firebaseEnvironment';

// The direct REST API approach when Firebase SDK fails
export const loginWithEmailDirect = async (email, password) => {
  console.log('🔄 Attempting direct Firebase REST API login');
  
  try {
    // Use the hardcoded API key directly
    const FIREBASE_API_KEY = firebaseConfig.apiKey;
    
    if (!FIREBASE_API_KEY) {
      throw new Error('API key is required');
    }
    
    console.log('📧 Email:', email);
    console.log('🔑 API key length:', FIREBASE_API_KEY.length);
    
    // Direct call to Firebase Auth REST API
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
    console.log('🌐 Calling Firebase Auth API at:', url.substring(0, 60) + '...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ REST API error:', data.error);
      throw new Error(data.error?.message || 'Login failed');
    }
    
    console.log('✅ Direct REST login successful!');
    
    // Return a user object that looks like Firebase Auth user
    return {
      uid: data.localId,
      email: data.email,
      emailVerified: false, // REST API doesn't return this
      displayName: null, // REST API doesn't return this
      photoURL: null, // REST API doesn't return this
      phoneNumber: null, // REST API doesn't return this
      isAnonymous: false,
      metadata: {
        creationTime: null,
        lastSignInTime: new Date().toISOString()
      },
      providerData: [
        {
          providerId: 'password',
          uid: data.email,
          displayName: null,
          email: data.email,
          phoneNumber: null,
          photoURL: null
        }
      ],
      // Store token for later use
      _token: data.idToken,
      _refreshToken: data.refreshToken,
      _expiresAt: new Date().getTime() + parseInt(data.expiresIn) * 1000,
    };
  } catch (error) {
    console.error('❌❌ Direct Firebase REST auth error:', error);
    throw error;
  }
};

// Get user profile using the direct REST approach
export const getUserProfileDirect = async (userId, idToken) => {
  try {
    const FIREBASE_API_KEY = firebaseConfig.apiKey;
    
    // Get user data from Firestore via REST API
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${userId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ REST API Firestore error:', data);
      return null;
    }
    
    // Convert Firestore REST response to a simpler object
    const fields = data.fields || {};
    const profile = {};
    
    Object.keys(fields).forEach(key => {
      const field = fields[key];
      
      // Extract the value based on type
      if (field.stringValue !== undefined) {
        profile[key] = field.stringValue;
      } else if (field.booleanValue !== undefined) {
        profile[key] = field.booleanValue;
      } else if (field.integerValue !== undefined) {
        profile[key] = parseInt(field.integerValue);
      } else if (field.doubleValue !== undefined) {
        profile[key] = field.doubleValue;
      } else if (field.arrayValue !== undefined) {
        profile[key] = field.arrayValue.values ? 
          field.arrayValue.values.map(v => v.stringValue || v.integerValue || v.booleanValue) : [];
      } else if (field.mapValue !== undefined) {
        // Handle maps recursively if needed
        profile[key] = {};
        const mapFields = field.mapValue.fields || {};
        Object.keys(mapFields).forEach(mapKey => {
          const mapField = mapFields[mapKey];
          profile[key][mapKey] = mapField.stringValue || mapField.integerValue || 
            mapField.booleanValue || mapField.doubleValue || null;
        });
      }
    });
    
    return profile;
  } catch (error) {
    console.error('❌ Direct Firestore access error:', error);
    return null;
  }
};
