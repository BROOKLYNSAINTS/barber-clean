import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createReview } from '@/services/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function WriteReviewScreen() {
  const router = useRouter();
  const { barberId, barberName = '' } = useLocalSearchParams();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    try {
      if (!barberId) { Alert.alert('Missing barber'); return; }
      if (!rating) { Alert.alert('Select a rating'); return; }
      setSubmitting(true);
      await createReview(String(barberId), { rating, text });
      Alert.alert('Thanks!', 'Your review was submitted.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      console.error('Create review error', e);
      Alert.alert('Error', e.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Review {barberName || 'Barber'}</Text>

        <View style={styles.ratingRow}>
          {[1,2,3,4,5].map(i => (
            <TouchableOpacity key={i} onPress={() => setRating(i)} style={styles.starBtn}>
              <Ionicons name={i <= rating ? 'star' : 'star-outline'} size={28} color="#f59e0b" />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Comments (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="How was your experience?"
          placeholderTextColor="#6B7280"
          multiline
          value={text}
          onChangeText={setText}
        />

        <TouchableOpacity style={[styles.button, submitting && styles.buttonDisabled]} onPress={submit} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Submit Review'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  starBtn: { padding: 6 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#111827' },
  input: {
    minHeight: 120,
    borderWidth: 2,
    borderColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  button: { backgroundColor: '#2196F3', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  buttonDisabled: { backgroundColor: '#A7C7F2' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});