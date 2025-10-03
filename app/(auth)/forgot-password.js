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
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/services/firebase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const onSendReset = async () => {
    try {
      setError('');
      if (!email?.trim()) {
        setError('Enter your email');
        return;
      }
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
      Alert.alert('Email sent', 'Check your inbox for a reset link.');
    } catch (e) {
      console.error('Reset error:', e);
      setError(e?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Reset Password</Text>

            {!!error && <Text style={styles.errorText}>{error}</Text>}
            {sent && <Text style={styles.infoText}>If an account exists, a reset link was sent.</Text>}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
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
                returnKeyType="send"
                onSubmitEditing={onSendReset}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={onSendReset}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.secondary}>
              <Text style={styles.secondaryText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  formContainer: { width: '100%' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 24, textAlign: 'center', color: '#111827' },
  field: { marginBottom: 18 },
  label: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#111827' },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700', // make input text bold
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
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
  secondary: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  secondaryText: { color: '#007bff', fontSize: 18, fontWeight: '700' },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 12, fontSize: 16, fontWeight: '600' },
  infoText: { color: '#065f46', textAlign: 'center', marginBottom: 12, fontSize: 16, fontWeight: '600' },
});

