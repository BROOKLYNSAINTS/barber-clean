import React, { useState } from 'react';
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
//import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DebugUser from '@/components/DebugUser';

// ✅ Safe JSON parsing
const safeParse = (input) => {
  if (!input) return null;
  try {
    return typeof input === 'string' ? JSON.parse(input) : input;
  } catch (err) {
    return null;
  }
};

export default function AppointmentConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const appointment = safeParse(params.appointment);
  const barber = safeParse(params.barber);
  const service = safeParse(params.service);

  const [loading, setLoading] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

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
      const defaultCalendar = calendars.find((cal) => cal.allowsModifications) || calendars[0];

      if (!defaultCalendar) {
        Alert.alert('Error', 'No writable calendar found.');
        setLoading(false);
        return;
      }

      const startDate = new Date(`${appointment.date}T${appointment.time}`);
      const endDate = new Date(startDate.getTime() + (service.duration || 30) * 60000);

      const eventDetails = {
        title: `Haircut: ${service.name} with ${barber.name}`,
        startDate,
        endDate,
        notes: `Appointment for ${service.name}. Price: $${(service.price || 0).toFixed(2)}`,
        location: barber.address,
        timeZone: Calendar.DEFAULT_CALENDAR_TIME_ZONE,
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
    console.log('🟡 Scheduling reminder...');
    console.log('📅 Appointment:', appointment);
    console.log('👤 Barber:', barber);
    console.log('✂️ Service:', service);

    setLoading(true);
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('🔐 Notification permission status:', status);

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Notification permission is required.');
      setLoading(false);
      return;
    }

    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    const triggerDate = new Date(appointmentDate);
    triggerDate.setDate(triggerDate.getDate() - 1);
    triggerDate.setHours(9, 0, 0);

    const secondsUntilTrigger = Math.floor((triggerDate.getTime() - Date.now()) / 1000);

    if (secondsUntilTrigger <= 0) {
      Alert.alert('Info', 'Appointment is too soon to schedule a reminder.');
      setLoading(false);
      return;
    }

    const content = {
      title: 'Upcoming Haircut Appointment',
      body: `Reminder: ${service.name} with ${barber.name} is tomorrow at ${appointment.time}`,
      data: { appointmentId: appointment.id },
    };

    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { seconds: secondsUntilTrigger, repeats: false },
    });

    console.log('✅ Reminder scheduled successfully');
    setReminderSet(true);
    Alert.alert('Success', 'Reminder scheduled for 9 AM the day before.');
  } catch (error) {
    console.error('❌ Error scheduling reminder:', error);
    Alert.alert('Error', 'Failed to set reminder.');
  } finally {
    setLoading(false);
  }
};
  const handleDone = () => {
router.replace({
  pathname: '/(app)/(customer)/appointment-details',
  params: {
    appointment: JSON.stringify(appointment),
    barber: JSON.stringify(barber),
    service: JSON.stringify(service),
  },
});
  };

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
      <DebugUser screenName="Appointment Confirmation" />
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
          <Text style={styles.detailValue}>{service.duration || 30} minutes</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>${(service.price || 0).toFixed(2)}</Text>
        </View>

        {barber.phone && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{barber.phone}</Text>
          </View>
        )}

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

      <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>

      <Text style={styles.reminderInfoText}>
        You can set a reminder for the day before your appointment.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
});
