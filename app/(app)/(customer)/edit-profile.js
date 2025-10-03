import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from '../../../src/services/firebase';
import { updatePassword } from 'firebase/auth';

const db = getFirestore(app);

export default function EditProfileScreen() {
  const { currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;

      try {
        const ref = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
          setZipcode(data.zipcode || '');
          setEmail(currentUser.email || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        Alert.alert('Error', 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser?.uid) return;

    try {
      setSaving(true);
      const ref = doc(db, 'users', currentUser.uid);
      await updateDoc(ref, { name, phone, address, zipcode });

      if (newPassword) {
        await updatePassword(currentUser, newPassword);
        Alert.alert('Success', 'Profile and password updated!');
        setNewPassword('');
      } else {
        Alert.alert('Success', 'Profile updated!');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput 
                value={name} 
                onChangeText={setName} 
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="home-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput 
                value={address} 
                onChangeText={setAddress} style={styles.input}
                placeholder="Street address"
                placeholderTextColor="#999" 
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Zip Code</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput 
                value={zipcode} 
                onChangeText={setZipcode} 
                style={styles.input}
                keyboardType="number-pad"
                placeholder="12345"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput 
                value={phone} 
                onChangeText={setPhone} 
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="(123) 456-7890"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Username (Email)</Text>
            <View style={[styles.inputContainer, styles.disabledContainer]}>
              <Ionicons name="mail-outline" size={24} color="#999" style={styles.inputIcon} />
              <TextInput 
                value={email} 
                editable={false} 
                style={[styles.input, styles.disabled]}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput 
                value={newPassword} 
                onChangeText={setNewPassword} 
                style={styles.input}
                secureTextEntry
                placeholder="Leave blank to keep current"
                placeholderTextColor="#999"
              />
            </View>
            <Text style={styles.hint}>Leave blank to keep your current password</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={24} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2196F3',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
  },
  formSection: {
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 22,
  },
  label: {
    marginBottom: 8,
    fontWeight: '700',
    fontSize: 18,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    paddingVertical: 16,
  },
  disabled: {
    color: '#999',
  },
  disabledContainer: {
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
  },
});
