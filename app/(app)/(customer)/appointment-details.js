import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, getUserProfile } from '@/services/firebase';
import { addAppointmentToCalendar, scheduleAppointmentReminder } from '@/services/notifications';

const AppointmentDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [appointment, setAppointment] = useState(null);
  const [barber, setBarber] = useState(null);
  const [service, setService] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

useEffect(() => {
  try {
    const parsedAppointment = params.appointment ? JSON.parse(params.appointment) : null;
    const parsedBarber = params.barber ? JSON.parse(params.barber) : null;
    const parsedService = params.service ? JSON.parse(params.service) : null;

    if (!parsedAppointment || !parsedBarber || !parsedService) {
      setError('Appointment, barber, or service data not found.');
      setLoading(false);
      return;
    }

    setAppointment(parsedAppointment);
    setBarber(parsedBarber);
    setService(parsedService);

    const fetchProfile = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userProfile = await getUserProfile(user.uid);
          setProfile(userProfile);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  } catch (err) {
    console.error('Parsing error:', err);
    setError('Invalid data format.');
    setLoading(false);
  }
  // ✅ Empty dependency array so this runs only once
}, []);

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleAddToCalendar = async () => {
    if (!appointment || !service || !barber) return;
    try {
      setProcessing(true);
      await addAppointmentToCalendar(appointment, service, barber);
      setCalendarAdded(true);
      Alert.alert('Success', 'Appointment added to calendar.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not add to calendar.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetReminder = async () => {
    if (!appointment) return;
    try {
      setProcessing(true);
      await scheduleAppointmentReminder(appointment);
      setReminderSet(true);
      Alert.alert('Success', 'Reminder set.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not set reminder.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelAppointment = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Cancelled', 'Your appointment has been cancelled.');
            router.back();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading appointment details...</Text>
      </View>
    );
  }

  if (error || !appointment || !barber || !service) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
        <Text style={styles.errorText}>{error || 'Missing data.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Appointment Details</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="person" size={20} color="#555" />
          <Text style={styles.label}>Barber:</Text>
          <Text style={styles.value}>{barber.name}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="cut" size={20} color="#555" />
          <Text style={styles.label}>Service:</Text>
          <Text style={styles.value}>{service.name}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="calendar" size={20} color="#555" />
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatDate(appointment.date)}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time" size={20} color="#555" />
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>{appointment.time}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="pricetag" size={20} color="#555" />
          <Text style={styles.label}>Price:</Text>
          <Text style={styles.value}>${service.price.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, calendarAdded && styles.disabled]}
          onPress={handleAddToCalendar}
          disabled={processing || calendarAdded}
        >
          <Text style={styles.buttonText}>
            {calendarAdded ? 'Added to Calendar' : 'Add to Calendar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, reminderSet && styles.disabled]}
          onPress={handleSetReminder}
          disabled={processing || reminderSet}
        >
          <Text style={styles.buttonText}>
            {reminderSet ? 'Reminder Set' : 'Set Reminder'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancelAppointment}>
        <Text style={styles.cancelText}>Cancel Appointment</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  errorText: { color: '#f44336', textAlign: 'center', margin: 10 },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 6,
  },
  retryButtonText: { color: '#fff', fontWeight: 'bold' },
  header: { padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 22, fontWeight: 'bold' },
  card: { padding: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  label: { marginLeft: 8, fontWeight: 'bold', width: 80 },
  value: { flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', margin: 16 },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  disabled: { backgroundColor: '#4CAF50' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 14,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: { color: '#fff', fontWeight: 'bold' },
});

export default AppointmentDetailsScreen;
