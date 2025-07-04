import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getUserProfile, updateUserProfile, auth } from '@/services/firebase';
import { useRouter } from 'expo-router';

const BarberAvailabilityScreen = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [unavailableDates, setUnavailableDates] = useState({});
  const [workingHours, setWorkingHours] = useState({ start: '08:00', end: '17:00', interval: 30 });

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated.');
        router.replace('/(auth)/login');
        return;
      }
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      if (userProfile.unavailableDates) setUnavailableDates(userProfile.unavailableDates);
      if (userProfile.workingHours) setWorkingHours(userProfile.workingHours);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load availability settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleDayPress = (day) => {
    const newDates = { ...unavailableDates };
    if (newDates[day.dateString]) {
      delete newDates[day.dateString];
    } else {
      newDates[day.dateString] = { disabled: true, disableTouchEvent: true };
    }
    setUnavailableDates(newDates);
  };

  const handleSaveAvailability = async () => {
    try {
      setSaving(true);
      setError('');
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }
      await updateUserProfile(user.uid, { unavailableDates, workingHours });
      Alert.alert('Success', 'Availability settings saved successfully!');
    } catch (err) {
      console.error('Error saving availability:', err);
      setError('Failed to save availability settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = (type, value) => {
    setWorkingHours(prev => ({ ...prev, [type]: value }));
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tap Dates You Are Unavailable</Text>
      <Calendar
        markedDates={unavailableDates}
        onDayPress={handleDayPress}
        theme={{
          selectedDayBackgroundColor: '#FF4136',
          todayTextColor: '#00adf5',
          arrowColor: 'orange',
        }}
      />
      <View style={styles.timeContainer}>
        <Text style={styles.subtitle}>Set Working Hours</Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => handleTimeChange('start', workingHours.start === '08:00' ? '09:00' : '08:00')} style={styles.timeButton}>
            <Text style={styles.timeText}>Start: {workingHours.start}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleTimeChange('end', workingHours.end === '17:00' ? '18:00' : '17:00')} style={styles.timeButton}>
            <Text style={styles.timeText}>End: {workingHours.end}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSaveAvailability} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Availability'}</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 12,
    textAlign: 'center',
  },
  timeContainer: {
    marginTop: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  timeButton: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    width: '40%',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
  },
});

export default BarberAvailabilityScreen;
