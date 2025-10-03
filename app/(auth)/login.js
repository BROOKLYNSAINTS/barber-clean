import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApps } from 'firebase/app';
import { useRouter } from 'expo-router';
import { auth } from '@/services/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseConfig } from '@/services/firebaseEnvironment';
import { loginWithEmail } from '@/services/restAuth';
import { getUserProfile } from '@/services/firebase';

export default function LoginWithEmail () {    
  console.log('📱 Rendering login screen');
  
  const router = useRouter();
  const devBypass = false; // ✅ Set to false when ready to test login normally

  useEffect(() => {
    if (devBypass) {
      console.log('🛠 Dev bypass active. Redirecting to /customer...');
      router.replace('/(app)/(customer)/index');
    }
  }, []);

  // Skip rendering form if bypassing
  if (devBypass) return null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false); // NEW
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update your login handler with better error handling and initialization checks
  const handleLogin = async () => {
    try {
      console.log('🔍 Login attempt for:', email);
      
      // Better auth validation
      if (!auth) {
        console.error('❌ Auth is not initialized!');
        throw new Error('Authentication service is unavailable');
      }
      
      console.log('🔥 Firebase auth instance status:', auth?.app ? 'Valid' : 'Invalid');
      console.log('🔥 Current auth state:', auth.currentUser ? 'User logged in' : 'No user');
      
      setLoading(true);
      setError('');

      // Debug log
      console.log(`🔒 Attempting login for email: ${email}`);
      
      // Add a check to ensure Firebase is initialized
      const firebaseApps = getApps();
      if (firebaseApps.length === 0) {
        console.error('❌ Firebase not initialized!');
        throw new Error('Authentication service is not available. Please try again.');
      }
      
      // Try login with proper error handling
      try {
        // Log the auth instance
        console.log('🔑 Auth instance:', auth ? 'Available' : 'Not available');
        
        const response = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Login successful:', response.user.uid);
        
        // Get user profile to determine role
        try {
          const userProfile = await getUserProfile(response.user.uid);
          
          // Navigate based on user role
          if (userProfile?.role === 'barber') {
            router.replace('/(app)/(barber)/dashboard');
          } else {
            router.replace('/(app)/(customer)'); // Removed "/index" - it's implied
          }
        } catch (profileError) {
          console.error('Error getting user profile:', profileError);
          // Default to customer route if profile check fails
          router.replace('/(app)/(customer)');
        }

        return;
      } catch (firebaseError) {
        console.error('❌ Firebase login error:', firebaseError);
        
        // Format user-friendly error
        if (firebaseError.code === 'auth/user-not-found' || 
            firebaseError.code === 'auth/wrong-password') {
          throw new Error('Invalid email or password');
        } else if (firebaseError.code === 'auth/too-many-requests') {
          throw new Error('Too many login attempts. Please try again later.');
        } else {
          throw new Error(`Login error: ${firebaseError.message}`);
        }
      }
    } catch (error) {
      console.error('🚫 Login process error:', error);
      setError(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign In</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#6B7280"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7280"
                  textContentType="password"
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(v => !v)}
                  style={styles.toggleButton}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Ionicons
                    name={passwordVisible ? 'eye-off' : 'eye'}
                    size={22}
                    color="#1F2937"
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/forgot-password')}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
    color: '#111827',
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 48, // space for eye icon
    fontSize: 18,
    fontWeight: '700', // bold input text
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  toggleButton: {
    position: 'absolute',
    right: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#007bff',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  registerText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    color: '#007bff',
    fontWeight: '700',
    fontSize: 16,
  },
});

