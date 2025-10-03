import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { scheduleAppointmentReminder } from '../../../src/services/notifications';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

// ✅ Safe JSON parsing
const safeParse = (input) => {
  if (!input) return null;
  try {
    return typeof input === 'string' ? JSON.parse(input) : input;
  } catch (err) {
    return null;
  }
};

function to24Hour(timeStr) {
  // Replace all unicode spaces (including U+202F, \u00A0, etc.) with a normal space, then trim
  timeStr = timeStr.replace(/[\u202F\u00A0\s]+/g, ' ').trim();
  // Split by space to separate time and AM/PM
  const parts = timeStr.split(' ');
  const time = parts[0];
  const modifier = parts[1] ? parts[1].toUpperCase() : '';
  if (!time) return '';
  let [hours, minutes] = time.split(':');
  if (modifier === 'PM' && hours !== '12') {
    hours = String(parseInt(hours, 10) + 12);
  }
  if (modifier === 'AM' && hours === '12') {
    hours = '00';
  }
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

function getAppointmentDate(dateStr, timeStr) {
  const time24 = to24Hour(timeStr);
  // Validate date and time
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
  if (!dateRegex.test(dateStr) || !timeRegex.test(time24)) {
    throw new Error('Invalid date or time format');
  }
  return new Date(`${dateStr}T${time24}`);
}

// Set the notification handler with updated properties
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // shows a banner when the notification is received
    shouldShowList: true,   // shows in the notification center/list
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Add this function to fetch appointment by ID
const fetchAppointmentById = async (appointmentId) => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (appointmentSnap.exists()) {
      return {
        id: appointmentSnap.id,
        ...appointmentSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return null;
  }
};

export default function AppointmentConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentUser } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [autoRemindersSet, setAutoRemindersSet] = useState(false);

  const appointmentId = params.id || params.appointmentId;

  // Fallbacks from route params
  const paramPrice = Number(params.servicePrice ?? params.price ?? 0);
  const paramDuration = Number(params.serviceDuration ?? params.duration ?? 0);

  // Helpers for safe price/duration display
  const getPriceNumber = (a) => {
    const v = a?.servicePrice ?? a?.price ?? paramPrice ?? 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const formatPrice = (a) => getPriceNumber(a).toFixed(2);

  const getDuration = (a) => {
    const v = a?.duration ?? paramDuration ?? null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  // Get appointmentId after all hooks
  // const appointmentId = params.id;
  
  // Define handlers after hooks
  const handleDone = () => {
    router.replace('/(app)/(customer)/');
  };

  // Fetch the appointment data when the component mounts
  useEffect(() => {
    const loadAppointment = async () => {
      try {
        console.log('Fetching appointment with ID:', appointmentId);
        const appointmentData = await fetchAppointmentById(appointmentId);
        
        if (!appointmentData) {
          setError('Appointment not found');
          setLoading(false);
          return;
        }
        
        console.log('Successfully loaded appointment:', appointmentData);
        setAppointment(appointmentData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading appointment:', err);
        setError('Failed to load appointment details');
        setLoading(false);
      }
    };
    
    loadAppointment();
  }, [appointmentId]);

  // Automatically set up reminders when component mounts
  useEffect(() => {
    const setupAutomaticReminders = async () => {
      if (!appointment || !currentUser?.uid || autoRemindersSet) {
        console.log('⚠️ Skipping reminder setup:', { 
          hasAppointment: !!appointment, 
          hasUser: !!currentUser?.uid, 
          alreadySet: autoRemindersSet 
        });
        return;
      }
      
      try {
        console.log('🔔 Setting up automatic reminders...', { appointment, userId: currentUser.uid });
        await scheduleAppointmentReminder(appointment, currentUser.uid);
        setAutoRemindersSet(true);
        console.log('✅ Automatic reminders set successfully');
      } catch (error) {
        console.error('❌ Error setting automatic reminders:', error);
      }
    };

    setupAutomaticReminders();
  }, [appointment, currentUser, autoRemindersSet]);

  const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string' || !dateString.includes('-')) return 'N/A';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    // Parse as local date to avoid UTC shift bug
    const [year, month, day] = dateString.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return 'N/A';
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString(undefined, options);
  };

  // REMOVE this function and its usage
  const addToCalendar = async () => {
    // Calendar integration removed (expo-calendar dependency stripped)
    return true;
  };

  const scheduleReminder = async () => {
    // This function is now deprecated since we do automatic reminders
    // Keeping for reference but not using
    Alert.alert(
      'Info', 
      'Reminders are automatically set when you book an appointment. Check your notification screen to see them!'
    );
  };

  // Check if there's any missing data and log what we have
  useEffect(() => {
    console.log("DEBUG: Appointment data loaded:", appointment);
    console.log("DEBUG: Price:", appointment?.price);
    console.log("DEBUG: Service name:", appointment?.serviceName);
  }, [appointment]);

  // IMPORTANT: Move this useEffect outside the conditional rendering
  useEffect(() => {
    if (appointment && getPriceNumber(appointment) <= 0) {
      console.error('WARNING: Displaying appointment with $0 price!');
      Alert.alert('Price Missing', 'This appointment has no price. Barbers cannot work for free.', [{ text: 'OK' }]);
    }
  }, [appointment]);

  // Fetch missing barber contact from profile if not on the appointment
  useEffect(() => {
    if (!appointment) return;
    if (appointment.barberPhone && appointment.barberAddress) return;

    (async () => {
      try {
        if (!appointment.barberId) return;
        const snap = await getDoc(doc(db, 'users', appointment.barberId));
        if (snap.exists()) {
          const data = snap.data() || {};
          setAppointment(prev =>
            prev
              ? {
                  ...prev,
                  barberName: prev.barberName || data.name || '',
                  barberPhone: prev.barberPhone || data.phone || '',
                  barberAddress: prev.barberAddress || data.address || '',
                }
              : prev
          );
        }
      } catch (e) {
        console.error('Failed to fetch barber contact info', e);
      }
    })();
  }, [appointment]);

  // 2. Use conditional rendering in the return statement, not early returns
  // This ensures hooks are always called in the same order
  return (
    <ScrollView>
      {loading ? (
        <View style={styles.centeredLoading}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading appointment confirmation...</Text>
        </View>
      ) : error || !appointment ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorText}>{error || 'Failed to load appointment'}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(app)/(customer)')}>
            <Text style={styles.buttonText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.container}>
          <Text style={styles.title}>Appointment Confirmed</Text>
          <Text style={styles.item}>Barber: {appointment.barberName || params.barberName || '—'}</Text>
          <Text style={styles.item}>Phone: {appointment.barberPhone || '—'}</Text>
          <Text style={styles.item}>Address: {appointment.barberAddress || '—'}</Text>
          <Text style={styles.item}>Service: {appointment.serviceName}</Text>
          <Text style={styles.item}>
            Duration: {getDuration(appointment) != null ? `${getDuration(appointment)} min` : '—'}
          </Text>
          <Text style={styles.item}>Price: ${formatPrice(appointment)}</Text>
          <Text style={styles.item}>Date: {formatDate(appointment.date)}</Text>
          <Text style={styles.item}>Time: {appointment.time}</Text>
          <Text style={styles.subtle}>Confirmation ID: {appointmentId}</Text>

          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(app)/(customer)/')}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  item: { fontSize: 16, marginVertical: 4 },
  subtle: { fontSize: 12, color: '#666', marginTop: 12 },
  button: { marginTop: 24, backgroundColor: '#2196F3', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  centeredLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  confirmationCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  confirmationIcon: { marginBottom: 16 },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationSubtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  detailsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  detailLabel: { fontWeight: '500', width: 80, color: '#555' },
  detailValue: { flex: 1, color: '#333' },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  disabledButtonGreen: { backgroundColor: '#4CAF50' },
  actionIcon: { marginRight: 8 },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: '#0288D1',
    paddingVertical: 15,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  reminderInfoText: {
    textAlign: 'center',
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 24,
    fontSize: 13,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
