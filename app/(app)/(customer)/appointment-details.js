import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addAppointmentToCalendar, scheduleAppointmentReminder } from '@/services/notifications'; // Adjusted path
import { getUserProfile, auth } from '@/services/firebase'; // Adjusted path
import { useRouter, useLocalSearchParams } from 'expo-router';

const AppointmentDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const appointment = params.appointment ? JSON.parse(params.appointment) : null;
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [barber, setBarber] = useState(null);
  const [service, setService] = useState(null);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

  useEffect(() => {
    if (appointment) {
      fetchData();
    } else {
      setError('Appointment data not found.');
      setLoading(false);
    }
  }, [appointment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const user = auth.currentUser;
      if (user) {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } else {
        // Handle case where user is not authenticated, though ideally this screen shouldn't be reachable
        setError('User not authenticated.');
        setLoading(false);
        return;
      }
      
      // In a real app, you would fetch the barber and service details from their respective IDs
      // For now, we'll use placeholder data based on the passed appointment object
      setBarber({
        id: appointment.barberId,
        name: appointment.barberName,
        address: appointment.barberAddress || '123 Main St, Anytown, USA', // Use provided or default
        phone: appointment.barberPhone || '(555) 123-4567',
      });
      
      setService({
        id: appointment.serviceId,
        name: appointment.serviceName,
        price: appointment.servicePrice,
        duration: appointment.serviceDuration || 30, // Use provided or default
        description: appointment.serviceDescription || 'Standard haircut service',
      });
      
      if (appointment.calendarEventId) {
        setCalendarAdded(true);
      }
      
      if (appointment.reminderNotificationId) {
        setReminderSet(true);
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      setError('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleAddToCalendar = async () => {
    if (!appointment || !service || !barber) return;
    try {
      setProcessing(true);
      const eventId = await addAppointmentToCalendar(appointment, service, barber);
      // In a real app, you would update this in your database and potentially re-fetch appointment
      // For now, just updating local state
      setCalendarAdded(true);
      Alert.alert('Success', 'Appointment added to your calendar');
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert('Error', 'Failed to add appointment to calendar');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetReminder = async () => {
    if (!appointment) return;
    try {
      setProcessing(true);
      const notificationId = await scheduleAppointmentReminder(appointment);
      // In a real app, you would update this in your database
      setReminderSet(true);
      Alert.alert('Success', 'Appointment reminder has been set');
    } catch (error) {
      console.error('Error setting reminder:', error);
      Alert.alert('Error', 'Failed to set appointment reminder');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelAppointment = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            // In a real app, you would implement cancellation logic (e.g., update Firestore)
            Alert.alert(
              'Appointment Cancelled',
              'Your appointment has been cancelled successfully',
              [{ text: 'OK', onPress: () => router.back() }]
            );
          }
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

  if (error || !appointment) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
        <Text style={styles.errorText}>{error || 'Appointment data is missing.'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={appointment ? fetchData : () => router.back()} // Go back if no appointment data
        >
          <Text style={styles.retryButtonText}>{appointment ? 'Retry' : 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  // Ensure barber and service are loaded before rendering details
  if (!barber || !service) {
     return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Appointment Details</Text>
      </View>

      <View style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <Ionicons name="calendar-outline" size={24} color="#2196F3" />
          <Text style={styles.appointmentDate}>{formatDate(appointment.date)}</Text>
          <Text style={styles.appointmentTime}>{appointment.time}</Text>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Barber:</Text>
            <Text style={styles.detailValue}>{barber.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service:</Text>
            <Text style={styles.detailValue}>{service.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>${service.price.toFixed(2)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{service.duration} minutes</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{barber.address}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, calendarAdded && styles.disabledButton]}
          onPress={handleAddToCalendar}
          disabled={processing || calendarAdded}
        >
          {processing && !calendarAdded ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="calendar-outline" size={20} color="#fff" style={styles.actionIcon} />
              <Text style={styles.actionButtonText}>
                {calendarAdded ? 'Added to Calendar' : 'Add to Calendar'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, reminderSet && styles.disabledButton]}
          onPress={handleSetReminder}
          disabled={processing || reminderSet}
        >
          {processing && !reminderSet ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="notifications-outline" size={20} color="#fff" style={styles.actionIcon} />
              <Text style={styles.actionButtonText}>
                {reminderSet ? 'Reminder Set' : 'Set Reminder'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={handleCancelAppointment}
      >
        <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
      </TouchableOpacity>

      <Text style={styles.reminderText}>
        You will receive a text reminder the day before your appointment
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  appointmentCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  appointmentDate: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  appointmentTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  detailsContainer: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontWeight: '500',
    width: 80,
  },
  detailValue: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  disabledButton: {
    backgroundColor: '#4CAF50', // Green for success/disabled state
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reminderText: {
    textAlign: 'center',
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 24,
  },
});

export default AppointmentDetailsScreen;

