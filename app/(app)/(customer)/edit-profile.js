import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { updateUserProfile, auth } from '@/services/firebase';
import { useLocalSearchParams, useRouter } from 'expo-router';

const EditProfileScreen = () => {
  const router = useRouter();
  const { profile: profileParam } = useLocalSearchParams();
  const profile = JSON.parse(profileParam);

  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [zipcode, setZipcode] = useState(profile?.zipcode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [cardNumber, setCardNumber] = useState(profile?.paymentInfo?.cardNumber || '');
  const [expiryDate, setExpiryDate] = useState(profile?.paymentInfo?.expiryDate || '');
  const [cvv, setCvv] = useState(profile?.paymentInfo?.cvv || '');

  const handleUpdateProfile = async () => {
    try {
      if (!name || !phone || !address || !zipcode) {
        setError('Please fill in all required fields');
        return;
      }

      if (profile.role === 'barber' && (!cardNumber || !expiryDate || !cvv)) {
        setError('Please fill in all payment information');
        return;
      }

      setLoading(true);
      setError('');

      const userData = {
        name,
        phone,
        address,
        zipcode,
        role: profile.role,
      };

      if (profile.role === 'barber') {
        userData.paymentInfo = {
          cardNumber,
          expiryDate,
          cvv,
          subscriptionActive: profile.paymentInfo?.subscriptionActive || true,
          subscriptionDate: profile.paymentInfo?.subscriptionDate || new Date().toISOString(),
        };
      }

      const user = auth.currentUser;
      await updateUserProfile(user, userData);

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your address"
          value={address}
          onChangeText={setAddress}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Zipcode</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your zipcode"
          value={zipcode}
          onChangeText={setZipcode}
          keyboardType="numeric"
        />
      </View>

      {profile.role === 'barber' && (
        <View style={styles.barberSection}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <Text style={styles.sectionSubtitle}>
            $30 monthly subscription fee will be charged
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Card Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your card number"
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Expiry Date (MM/YY)</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/YY"
              value={expiryDate}
              onChangeText={setExpiryDate}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>CVV</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter CVV"
              value={cvv}
              onChangeText={setCvv}
              keyboardType="numeric"
              secureTextEntry
            />
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleUpdateProfile}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Updating...' : 'Update Profile'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  barberSection: {
    marginTop: 10,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#9e9e9e',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

// ✅ Expo Router screen export
export default function Screen() {
  return <EditProfileScreen />;
}
