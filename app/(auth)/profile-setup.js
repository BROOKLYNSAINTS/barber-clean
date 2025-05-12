import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { createUserProfile } from '@/services/firebase'; // Adjusted path
import { useRouter, useLocalSearchParams } from 'expo-router';

const ProfileSetupScreen = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams(); // Get userId from route params
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [isBarber, setIsBarber] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Credit card fields for barbers
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handleSaveProfile = async () => {
    try {
      if (!name || !phone || !address || !zipcode) {
        setError('Please fill in all required fields');
        return;
      }

      if (isBarber && (!cardNumber || !expiryDate || !cvv)) {
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
        role: isBarber ? 'barber' : 'customer',
      };

      if (isBarber) {
        userData.paymentInfo = {
          cardNumber,
          expiryDate,
          cvv,
          subscriptionActive: true,
          subscriptionDate: new Date().toISOString(),
        };
      }

      await createUserProfile(userId, userData);
      
      if (isBarber) {
        router.replace('/(app)/(barber)/dashboard');
      } else {
        // BarberSelectionScreen was moved to (app)/(customer)/index.js
        router.replace('/(app)/(customer)/'); 
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      
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
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>I am a Barber</Text>
        <Switch
          value={isBarber}
          onValueChange={setIsBarber}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isBarber ? '#2196F3' : '#f4f3f4'}
        />
      </View>
      
      {isBarber && (
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
        onPress={handleSaveProfile}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : 'Save Profile'}
        </Text>
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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

export default ProfileSetupScreen;

