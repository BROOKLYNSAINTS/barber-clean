// app/(app)/(customer)/index.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function IndexScreen() {
  const router = useRouter();
  const [zipcode, setZipcode] = useState('');

  const handleSubmit = () => {
    if (zipcode.length === 5) {
      router.push({
        pathname: '/(app)/(customer)/barber-selection',
        params: { zipcode },
      });
    } else {
      alert('Please enter a valid 5-digit ZIP code');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome to ScheduleSync</Text>
          <Text style={styles.subtitle}>Find a barber near you</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter ZIP Code"
            value={zipcode}
            onChangeText={setZipcode}
            keyboardType="numeric"
            maxLength={5}
          />
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.buttonText}>Search Barbers</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
});
