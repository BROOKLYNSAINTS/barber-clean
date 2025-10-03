import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { registerUser, createUserProfile } from '@/services/firebase';
import { useRouter } from 'expo-router';

const RegisterScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    try {
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setLoading(true);
      setError('');
      const user = await registerUser(email, password);

      await createUserProfile(user.uid, {
        email,
        userType: 'customer',
        createdAt: new Date().toISOString(),
      });

      router.push({ pathname: '(auth)/profile-setup', params: { userId: user.uid } });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.form}>
            <Text style={styles.title}>Create Account</Text>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.inputContainer}>
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

            <View style={styles.inputContainer}>
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
                  returnKeyType="next"
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(v => !v)}
                  style={styles.toggleButton}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={22} color="#1F2937" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#6B7280"
                  textContentType="password"
                  secureTextEntry={!confirmVisible}
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setConfirmVisible(v => !v)}
                  style={styles.toggleButton}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Ionicons name={confirmVisible ? 'eye-off' : 'eye'} size={22} color="#1F2937" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Register'}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.link}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  form: { width: '100%' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 24, textAlign: 'center', color: '#111827' },
  inputContainer: { marginBottom: 18 },
  label: { marginBottom: 8, fontSize: 18, fontWeight: '700', color: '#111827' },
  inputWrapper: { position: 'relative' },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 48,
    fontSize: 18,
    fontWeight: '700', // bold input text
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  toggleButton: { position: 'absolute', right: 12, height: 56, justifyContent: 'center', alignItems: 'center' },
  button: {
    backgroundColor: '#007bff',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { backgroundColor: '#cccccc' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { fontSize: 16, fontWeight: '600', color: '#333' },
  link: { color: '#007bff', fontWeight: '700', fontSize: 16 },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 10, fontSize: 16, fontWeight: '600' },
});

export default RegisterScreen;