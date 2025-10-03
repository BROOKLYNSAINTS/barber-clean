import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { auth } from '@/services/firebase';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/services/firebase';
import { scheduleAppointmentReminder, cancelAppointmentNotifications, removeAppointmentFromCalendar } from '@/services/notifications';
import { createAndPresentServicePaymentSheet, getAppointmentPaymentStatus } from '@/services/stripe';
import { useStripe } from '@stripe/stripe-react-native';
import { getUserProfile, cancelAppointment } from '@/services/firebase';

// Initialize Firestore
const db = getFirestore(app);

// ✅ Safe JSON parsing utility
const safeParse = (input) => {
  if (!input) return null;
  try {
    return typeof input === 'string' ? JSON.parse(input) : input;
  } catch (err) {
    console.error('Error parsing JSON:', err, input);
    return null;
  }
};

const logAppointmentData = (app) => {
  if (!app) {
    console.error('❌ No appointment data to log');
    return;
  }
  
  console.log('====== APPOINTMENT DATA ======');
  console.log('ID:', app.id);
  console.log('Barber:', app.barberName);
  console.log('Service:', app.serviceName);
  console.log('Price:', app.servicePrice);
  console.log('Date:', app.date);
  console.log('Time:', app.time);
  console.log('==============================');
};

// Add this function at the top level
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

const AppointmentDetailsScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Rest of your state variables
  const [profile, setProfile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({ isPaid: false, amount: 0, paidAt: null });
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Get the appointment ID from params
  const appointmentId = params.id;
  
  // Load the appointment data from Firebase
  useEffect(() => {
    const loadAppointment = async () => {
      try {
        if (!appointmentId) {
          setError('No appointment ID provided.');
          setLoading(false);
          return;
        }
        
        console.log('Fetching appointment with ID:', appointmentId);
        const appointmentData = await fetchAppointmentById(appointmentId);
        
        if (!appointmentData) {
          setError('Appointment not found.');
          setLoading(false);
          return;
        }
        
        console.log('Successfully loaded appointment:', appointmentData);
        setAppointment(appointmentData);
        
        // Log the essential appointment data
        console.log('APPOINTMENT DATA:', {
          id: appointmentData.id,
          price: appointmentData.price,
          servicePrice: appointmentData.servicePrice,
          serviceName: appointmentData.serviceName
        });
        
        // Load user profile
        const user = auth.currentUser;
        if (user) {
          const userProfile = await getUserProfile(user.uid);
          setProfile(userProfile);
            
          // Check payment status - handle the case where the function might be missing
          try {
            if (appointmentData.id && typeof getAppointmentPaymentStatus === 'function') {
              const paymentInfo = await getAppointmentPaymentStatus(appointmentData.id);
              setPaymentStatus(paymentInfo);
              console.log('💳 status for appointment:', paymentInfo);
            } else {
              // If the function doesn't exist, use a default payment status
              console.log('Payment status function not available, using default status');
              setPaymentStatus({ 
                isPaid: appointmentData.paymentStatus === 'paid',
                amount: appointmentData.price || appointmentData.servicePrice || 0,
                paidAt: appointmentData.paidAt || null
              });
            }
          } catch (paymentError) {
            console.error('Error getting payment status:', paymentError);
            // Don't let payment status error prevent showing the appointment
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading appointment:', err);
        setError('Failed to load appointment details.');
        setLoading(false);
      }
    };
    
    loadAppointment();
  }, [appointmentId]);

  // Fix the date shift bug by parsing as local date
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (!dateString || typeof dateString !== 'string' || !dateString.includes('-')) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString(undefined, options);
  };

  const handleSetReminder = async () => {
    if (!appointment) return;
    try {
      // Debug logs for date/time conversion
      console.log('DEBUG appointment.date:', appointment.date);
      console.log('DEBUG appointment.time:', appointment.time);
      
      setProcessing(true);
      
      // Prepare appointment data for reminder
      const reminderData = {
        id: appointment.id,
        date: appointment.date,
        time: appointment.time,
        serviceName: appointment.serviceName || 'Haircut',
        barberName: appointment.barberName || 'Barber'
      };
      
      await scheduleAppointmentReminder(reminderData);
      setReminderSet(true);
      Alert.alert('Success', 'Reminder set.');
    } catch (err) {
      console.error('Error setting reminder:', err);
      Alert.alert('Error', 'Could not set reminder.');
    } finally {
      setProcessing(false);
    }
  };

  const functions = getFunctions();
  const cancelAppointmentFunction = httpsCallable(functions, 'cancelAppointment');

  const handleCancelAppointment = async () => {
    try {
      // Show confirmation dialog
      Alert.alert(
        'Cancel Appointment',
        'Are you sure you want to cancel this appointment?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes, Cancel', 
            style: 'destructive',
            onPress: async () => {
              try {
                setProcessing(true);
                
                // Try both methods - Cloud Function first, then local fallback if needed
                let cancelled = false;
                let errorMessage = '';
                
                // First try: Cloud Function approach
                if (auth.currentUser) {
                  try {
                    console.log('Attempting cancellation via Cloud Function...');
                    const functions = getFunctions();
                    const cancelAppointmentFunction = httpsCallable(functions, 'cancelAppointment');
                    await cancelAppointmentFunction({ 
                      appointmentId: appointment.id,
                      userId: auth.currentUser.uid
                    });
                    cancelled = true;
                  } catch (cloudError) {
                    console.log('Cloud Function approach failed:', cloudError);
                    errorMessage = 'Server-side cancellation failed';
                    // We'll try the local approach next, don't show error yet
                  }
                }
                
                // Second try: Local approach if cloud function failed
                if (!cancelled) {
                  try {
                    console.log('Attempting local cancellation approach...');
                    
                    // Update appointment status
                    const appointmentRef = doc(db, 'appointments', appointment.id);
                    await updateDoc(appointmentRef, {
                      status: 'cancelled',
                      cancelledAt: serverTimestamp(),
                      updatedAt: serverTimestamp()
                    });
                    
                    // Restore availability slots
                    await restoreCancelledTimeSlots(appointment);
                    
                    cancelled = true;
                  } catch (localError) {
                    console.error('Local approach failed too:', localError);
                    errorMessage = 'Failed to update appointment status';
                  }
                }
                
                // Third step: Always try to clean up notifications regardless of cancellation
                try {
                  if (auth.currentUser && appointment?.id) {
                    await cancelAppointmentNotifications(appointment.id, auth.currentUser.uid);
                  }
                } catch (notifError) {
                  console.log('Non-critical: Failed to cancel notifications:', notifError);
                  // Don't affect the main cancellation status
                }
                
                // Final result: Either success or show error
                if (cancelled) {
                  // Success! Show message and navigate back
                  Alert.alert(
                    'Appointment Cancelled',
                    'Your appointment has been successfully cancelled.',
                    [
                      { 
                        text: 'OK', 
                        onPress: () => {
                          router.replace('/(app)/(customer)/appointments');
                        }
                      }
                    ]
                  );
                } else {
                  // Both approaches failed, show error
                  Alert.alert(
                    'Cancellation Failed', 
                    'We were unable to cancel your appointment. Please try again or contact support.'
                  );
                }
              } catch (finalError) {
                // Something unexpected happened
                console.error('Unexpected error during cancellation:', finalError);
                Alert.alert(
                  'Unexpected Error',
                  'Something went wrong. Please try again later.'
                );
              } finally {
                setProcessing(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error initiating appointment cancellation:', error);
      Alert.alert('Error', 'Could not start cancellation process.');
    }
  };

  const handlePayForService = async () => {
    if (!appointment?.id) {
      Alert.alert('Error', 'Cannot process payment: missing appointment ID.');
      return;
    }

    if (paymentStatus.isPaid) {
      Alert.alert('Already Paid', 'This service has already been paid for.');
      return;
    }

    try {
      setPaymentProcessing(true);
      
      // Use the new Stripe payment sheet integration
      const result = await createAndPresentServicePaymentSheet(
        auth.currentUser?.uid,
        appointment.barberId,
        appointment.id,
        appointment.price,
        `${appointment.serviceName} - ${appointment.barberName}`
      );

      if (result.success) {
        // Update local payment status
        setPaymentStatus({
          isPaid: true,
          amount: appointment.price,
          paidAt: new Date()
        });

        const paymentMessage = result.demo 
          ? `Demo payment of $${appointment.price?.toFixed(2)} has been processed successfully. (Backend not configured - this is simulation mode)`
          : `Payment of $${appointment.price?.toFixed(2)} has been processed successfully.`;

        Alert.alert(
          'Payment Successful',
          paymentMessage,
          [{ text: 'OK' }]
        );
      } else if (result.canceled) {
        // User canceled the payment
        console.log('Payment was canceled by user');
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      let errorMessage = 'There was an error processing your payment. Please try again.';
      
      // Handle specific error cases
      if (error.message.includes('backend call') || error.message.includes('configuration')) {
        errorMessage = 'Payment system is not fully configured. Using demo mode.';
      } else if (error.message.includes('secret format')) {
        errorMessage = 'Payment configuration error. Using demo payment instead.';
      }
      
      Alert.alert('Payment Notice', errorMessage);
    } finally {
      setPaymentProcessing(false);
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

  if (error || !appointment) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
        <Text style={styles.errorText}>{error || 'Missing appointment data.'}</Text>
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

      {/* Appointment details card */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="person" size={20} color="#555" />
          <Text style={styles.label}>Barber:</Text>
          <Text style={styles.value}>{appointment.barberName}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="cut" size={20} color="#555" />
          <Text style={styles.label}>Service:</Text>
          <Text style={styles.value}>{appointment.serviceName}</Text>
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
          <Text style={styles.value}>${(appointment.price).toFixed(2) }</Text>
        </View>
        
        {/* Payment Status Row */}
        <View style={styles.row}>
          <Ionicons 
            name={paymentStatus.isPaid ? "checkmark-circle" : "card"} 
            size={20} 
            color={paymentStatus.isPaid ? "#4CAF50" : "#555"} 
          />
          <Text style={styles.label}>Payment:</Text>
          <Text style={[styles.value, paymentStatus.isPaid && styles.paidText]}>
            {paymentStatus.isPaid ? 'Paid' : 'Pending'}
          </Text>
        </View>
      </View>

      {/* 1. Payment Button */}
      {!paymentStatus.isPaid && appointment.price > 0 && (
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[styles.fullButton, paymentProcessing && styles.disabledButton]} 
            onPress={handlePayForService}
            disabled={paymentProcessing}
          >
            <Ionicons name="card-outline" size={24} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.fullButtonText}>
              {paymentProcessing ? 'Processing...' : `Pay $${(appointment.price)?.toFixed(2)}`}
            </Text>
          </TouchableOpacity>
          <Text style={styles.buttonHint}>Pay after service is completed</Text>
        </View>
      )}

      {/* If already paid, show payment completed */}
      {paymentStatus.isPaid && (
        <View style={styles.paidSection}>
          <View style={styles.paidIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.paidText}>Payment Completed</Text>
          </View>
          <Text style={styles.paidAmount}>
            ${paymentStatus.amount?.toFixed(2)} paid on {paymentStatus.paidAt ? new Date(paymentStatus.paidAt.toDate?.() || paymentStatus.paidAt).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      )}

      {/* 2. Tip Button */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.fullButton}
          onPress={() => router.push({
            pathname: '/(app)/(customer)/tip',
            params: {
              appointmentId: appointment.id,
              barberId: appointment.barberId,
              barberName: appointment.barberName,
              serviceName: appointment.serviceName,
              servicePrice: appointment.price || appointment.servicePrice || 0
            }
          })}
        >
          <Ionicons name="cash-outline" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.fullButtonText}>Add Tip</Text>
        </TouchableOpacity>
      </View>
      
      {/* 3. Write Review Button */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.fullButton}
          onPress={() => router.push({
            pathname: '/(app)/(customer)/write-review',
            params: {
              barberId: appointment.barberId,
              barberName: appointment.barberName
            }
          })}
        >
          <Ionicons name="star-outline" size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.fullButtonText}>Write Review</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Cancel Button */}
      <View style={styles.buttonSection}>
        <TouchableOpacity 
          style={[styles.cancelButton, processing && styles.disabledButton]} 
          onPress={handleCancelAppointment}
          disabled={processing}
        >
          <Ionicons name="close-circle-outline" size={24} color="#F44336" style={styles.buttonIcon} />
          <Text style={styles.cancelText}>
            {processing ? 'Cancelling...' : 'Cancel Appointment'}
          </Text>
        </TouchableOpacity>
      </View>
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
  paidText: { color: '#4CAF50', fontWeight: 'bold' },
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
  buttonIcon: { marginRight: 8 },
  paymentSection: {
    margin: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
  },
  payButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    width: '100%',
    marginBottom: 8,
  },
  disabledPayment: { backgroundColor: '#999' },
  payButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16,
    marginLeft: 8 
  },
  paymentHint: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  paidSection: {
    margin: 20,
    padding: 16,
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    alignItems: 'center',
  },
  paidIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paidAmount: {
    color: '#666',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 2,
    borderColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    width: '90%',
  },
  cancelText: { 
    color: '#F44336', 
    fontWeight: 'bold',
    fontSize: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    marginTop: 12,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 6,
  },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    width: '48%',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  buttonSection: {
    margin: 12,
    alignItems: 'center',
  },
  fullButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    width: '90%', 
    marginHorizontal: 20,
  },
  fullButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonHint: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  disabledButton: { 
    backgroundColor: '#999',
    opacity: 0.7,
  },
});

// Add this function to restore availability
const restoreCancelledTimeSlots = async (appointment) => {
  try {
    // Skip if no barber ID
    if (!appointment.barberId) {
      console.error('Cannot restore availability: missing barber ID');
      return;
    }
    
    const { barberId, date } = appointment;
    
    // Get time slots that need to be restored
    let slotsToRestore = [];
    
    // If the appointment has slotsBooked array, use that
    if (Array.isArray(appointment.slotsBooked) && appointment.slotsBooked.length > 0) {
      slotsToRestore = appointment.slotsBooked;
      console.log('Restoring slots from slotsBooked:', slotsToRestore);
    }
    // Otherwise, calculate slots based on time24 and duration
    else {
      const time24 = appointment.time24 || to24Hour(appointment.time);
      
      if (!time24) {
        console.error('Cannot restore availability: invalid time format');
        return;
      }
      
      const duration = Number(appointment.duration) || 30;
      const intervalMinutes = 30; // Standard interval
      const slotsNeeded = Math.ceil(duration / intervalMinutes);
      
      // Calculate all slots that were used
      const startTimeMinutes = timeToMinutes(time24);
      for (let i = 0; i < slotsNeeded; i++) {
        const slotTime = minutesToTime(startTimeMinutes + (i * intervalMinutes));
        slotsToRestore.push(slotTime);
      }
      
      console.log('Restoring calculated slots:', slotsToRestore);
    }
    
    // Update barber's availability to add back these slots
    if (slotsToRestore.length > 0) {
      const barberRef = doc(db, 'users', barberId);
      
      // Get current availability
      const barberSnap = await getDoc(barberRef);
      if (!barberSnap.exists()) {
        console.error('Cannot restore availability: barber not found');
        return;
      }
      
      const barberData = barberSnap.data();
      const availability = barberData.availability || {};
      const existingSlots = availability[date] || [];
      
      // Add the slots back, keeping them sorted
      const updatedSlots = [...existingSlots, ...slotsToRestore]
        .filter((slot, i, arr) => arr.indexOf(slot) === i) // Deduplicate
        .sort(); // Sort chronologically
      
      // Update the barber's availability
      await updateDoc(barberRef, {
        [`availability.${date}`]: updatedSlots
      });
      
      console.log('✅ Restored availability slots:', updatedSlots);
    }
  } catch (error) {
    console.error('Error restoring availability:', error);
    // Don't throw so this doesn't prevent the cancellation from completing
  }
};

// Helper function: Convert time (HH:MM) to minutes since midnight
function timeToMinutes(time) {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

// Helper function: Convert minutes since midnight to time (HH:MM)
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export default AppointmentDetailsScreen;
