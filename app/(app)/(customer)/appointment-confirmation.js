import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Assuming services are correctly pathed from the project root
// If services are in /services, and this file is in app/(app)/(customer)/
// The path should be ../../../../services/
// However, the original zip had services at the same level as app, components etc.
// Let's assume the services folder is at the root of the `barber-clean` directory.
// So from `barber-clean/app/(app)/(customer)/` to `barber-clean/services/` is `../../../../services/`
// The previous files used `../../../services/` if they were one level up from `app` (e.g. in `src/screens`).
// Given the current structure is `barber-clean/app/(app)/(customer)/` and `barber-clean/services/`
// The path is indeed `../../../../services/`.
// The provided file has `../services/` which is incorrect for the new structure.
// Let's correct this if firebase/notifications are used. They are not directly used here, but good to note.

const AppointmentConfirmationScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Safely parse parameters
  const appointment = params.appointment ? JSON.parse(params.appointment) : null;
  const barber = params.barber ? JSON.parse(params.barber) : null;
  const service = params.service ? JSON.parse(params.service) : null;
  
  const [loading, setLoading] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  // const [error, setError] = useState(''); // Error state not used in original, can be added if needed

  useEffect(() => {
    if (!appointment || !barber || !service) {
      // Handle missing parameters, perhaps show an error or redirect
      Alert.alert("Error", "Appointment details are missing. Cannot display confirmation.", [
        { text: "OK", onPress: () => router.replace('/(app)/(customer)/appointments') } // Or to home
      ]);
    }
  }, [appointment, barber, service, router]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const addToCalendar = async () => {
    if (!appointment || !barber || !service) return;
    try {
      setLoading(true);
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Calendar permission is required.');
        setLoading(false);
        return;
      }
      
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0]; // Fallback to first calendar
      
      if (!defaultCalendar) {
        Alert.alert('Error', 'No writable calendar found.');
        setLoading(false);
        return;
      }
      
      const startDate = new Date(`${appointment.date}T${appointment.time}`);
      const endDate = new Date(startDate.getTime() + service.duration * 60000);
      
      const eventDetails = {
        title: `Haircut: ${service.name} with ${barber.name}`,
        startDate,
        endDate,
        notes: `Appointment for ${service.name}. Price: $${service.price.toFixed(2)}`,
        location: barber.address,
        timeZone: Calendar.DEFAULT_CALENDAR_TIME_ZONE, // Use device's default timezone
        alarms: [{ relativeOffset: -60 }], 
      };
      
      await Calendar.createEventAsync(defaultCalendar.id, eventDetails);
      setCalendarAdded(true);
      Alert.alert('Success', 'Appointment added to your calendar.');
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert('Error', 'Failed to add appointment to calendar.');
    } finally {
      setLoading(false);
    }
  };

  const scheduleReminder = async () => {
    if (!appointment || !barber || !service) return;
    try {
      setLoading(true);
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Notification permission is required for reminders.');
        setLoading(false);
        return;
      }
      
      const content = {
        title: 'Upcoming Haircut Appointment',
        body: `Reminder: Your appointment for ${service.name} with ${barber.name} is tomorrow at ${appointment.time}.`,
        data: { appointmentId: appointment.id, screen: '/(app)/(customer)/appointment-details', params: { appointment: JSON.stringify(appointment) } },
      };
      
      const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
      const triggerDate = new Date(appointmentDate);
      triggerDate.setDate(triggerDate.getDate() - 1); // One day before
      triggerDate.setHours(9, 0, 0); // At 9 AM

      if (triggerDate < new Date()) {
        Alert.alert("Info", "Cannot set reminder as the appointment is too soon or in the past.");
        setLoading(false);
        return;
      }
      
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: triggerDate,
      });
      setReminderSet(true);
      Alert.alert('Success', 'Appointment reminder has been set.');
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      Alert.alert('Error', 'Failed to set appointment reminder.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    // Replace to avoid going back to confirmation. Navigate to the main appointments list.
    router.replace('/(app)/(customer)/appointments');
  };

  // Render a loading/error state if essential params are missing
  if (!appointment || !barber || !service) {
    return (
      <View style={styles.centeredLoading}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>Loading confirmation...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.confirmationCard}>
        <Ionicons name="checkmark-circle" size={64} color="#4CAF50" style={styles.confirmationIcon} />
        <Text style={styles.confirmationTitle}>Appointment Confirmed!</Text>
        <Text style={styles.confirmationSubtitle}>Your appointment has been successfully booked.</Text>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Appointment Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Barber:</Text>
          <Text style={styles.detailValue}>{barber.name}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Service:</Text>
          <Text style={styles.detailValue}>{service.name}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{formatDate(appointment.date)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time:</Text>
          <Text style={styles.detailValue}>{appointment.time}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{service.duration} minutes</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>${service.price.toFixed(2)}</Text>
        </View>
        
        {barber.address && (
            <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{barber.address}</Text>
            </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, calendarAdded && styles.disabledButtonGreen]}
          onPress={addToCalendar}
          disabled={loading || calendarAdded}
        >
          {loading && !calendarAdded ? (
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
          style={[styles.actionButton, reminderSet && styles.disabledButtonGreen]}
          onPress={scheduleReminder}
          disabled={loading || reminderSet}
        >
          {loading && !reminderSet ? (
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
        style={styles.doneButton}
        onPress={handleDone}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>

      <Text style={styles.reminderInfoText}>
        You can set a reminder for the day before your appointment.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centeredLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  confirmationIcon: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
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
  detailLabel: {
    fontWeight: '500',
    width: 80,
    color: '#555',
  },
  detailValue: {
    flex: 1,
    color: '#333',
  },
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
  disabledButtonGreen: {
    backgroundColor: '#4CAF50',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: '#0288D1', // A slightly different blue for primary action
    paddingVertical: 15,
    marginHorizontal: 16,
    marginTop: 8, // Added some top margin
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reminderInfoText: {
    textAlign: 'center',
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 24,
    fontSize: 13,
  },
});

export default AppointmentConfirmationScreen;

