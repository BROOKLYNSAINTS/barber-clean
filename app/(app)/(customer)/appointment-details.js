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
  // Safe JSON parsing utility
  const safeParse = (input) => {
    if (!input) return null;
    try {
      return typeof input === 'string' ? JSON.parse(input) : input;
    } catch (err) {
      return null;
    }
  };

  // Use safeParse for params
  const params = useLocalSearchParams();
  const appointment = safeParse(params.appointment);
  const barber = safeParse(params.barber);
  const service = safeParse(params.service);

  console.log('DEBUG parsed appointment:', appointment);
  console.log('DEBUG parsed time:', appointment?.time);
  console.log('DEBUG to24Hour:', to24Hour(appointment?.time));

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

  useEffect(() => {
    try {
      if (!appointment || !barber || !service) {
        setError('Appointment, barber, or service data not found.');
        setLoading(false);
        return;
      }

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
      console.error('Error:', err);
      setError('Invalid data format.');
      setLoading(false);
    }
    // ✅ Empty dependency array so this runs only once
  }, []);

  // Fix the date shift bug by parsing as local date
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (!dateString || typeof dateString !== 'string' || !dateString.includes('-')) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString(undefined, options);
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

  const scheduleReminder = async () => {
    if (!appointment || !barber || !service) return;
    try {
      // Debug logs for date/time conversion
      console.log('DEBUG appointment.date:', appointment.date);
      console.log('DEBUG appointment.time:', appointment.time);
      console.log('DEBUG to24Hour(appointment.time):', to24Hour(appointment.time));

      let appointmentDate;
      try {
        appointmentDate = getAppointmentDate(appointment.date, appointment.time);
        console.log('DEBUG getAppointmentDate result:', appointmentDate);
      } catch (err) {
        console.error('DEBUG getAppointmentDate error:', err);
        Alert.alert('Error', 'Invalid date or time format.');
        return;
      }
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

function to24Hour(timeStr) {
  // Replace all unicode and normal spaces with a single space, then trim
  if (!timeStr) return '';
  timeStr = String(timeStr).replace(/[\u202F\u00A0\u2009\u2007\u200A\u200B\u200C\u200D\uFEFF\s]+/g, ' ').trim();
  const parts = timeStr.split(' ');
  const time = parts[0];
  const modifier = parts[1] ? parts[1].toUpperCase() : '';
  if (!time) return '';
  let [hours, minutes] = time.split(':');
  hours = hours.padStart(2, '0'); // Ensure two digits
  if (modifier === 'PM' && hours !== '12') {
    hours = String(parseInt(hours, 10) + 12).padStart(2, '0');
  }
  if (modifier === 'AM' && hours === '12') {
    hours = '00';
  }
  return `${hours}:${minutes ? minutes.padStart(2, '0') : '00'}`;
}

function getAppointmentDate(dateStr, timeStr) {
  // Defensive: sanitize time string
  let time24 = to24Hour(timeStr);
  if (/^\d{2}:\d{2}$/.test(time24)) {
    time24 += ':00';
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
  if (!dateRegex.test(dateStr) || !timeRegex.test(time24)) {
    console.error('Invalid date or time format', { dateStr, timeStr, time24 });
    throw new Error('Invalid date or time format');
  }
  // Split date and time into parts
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes, seconds] = time24.split(':').map(Number);
  if (
    isNaN(year) || isNaN(month) || isNaN(day) ||
    isNaN(hours) || isNaN(minutes) || (seconds !== undefined && isNaN(seconds))
  ) {
    console.error('Date or time contains NaN', { year, month, day, hours, minutes, seconds });
    throw new RangeError('Date value out of bounds');
  }
  // JS Date: months are 0-based
  const dateObj = new Date(year, month - 1, day, hours, minutes, seconds || 0);
  if (isNaN(dateObj.getTime())) {
    console.error('Constructed date is invalid', { year, month, day, hours, minutes, seconds });
    throw new RangeError('Date value out of bounds');
  }
  return dateObj;
}

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
