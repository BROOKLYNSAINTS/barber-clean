import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, updateUserProfile, auth } from '@/services/firebase'; // Adjusted path
import { useRouter, useFocusEffect } from 'expo-router'; // Added useFocusEffect

const BarberAvailabilityScreen = () => {
  const router = useRouter(); // Added router
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [workingDays, setWorkingDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });
  
  const [workingHours, setWorkingHours] = useState({
    start: '09:00',
    end: '17:00',
    interval: 30, 
  });
  
  const [unavailableDates, setUnavailableDates] = useState({});
  const [selectedDate, setSelectedDate] = useState('');

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated.');
        router.replace('/(auth)/login');
        setLoading(false);
        return;
      }
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      
      if (userProfile.workingDays) {
        setWorkingDays(userProfile.workingDays);
      }
      if (userProfile.workingHours) {
        setWorkingHours(userProfile.workingHours);
      }
      if (userProfile.unavailableDates) {
        setUnavailableDates(userProfile.unavailableDates);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load availability settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  const handleDayToggle = (day) => {
    setWorkingDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleDateSelect = (date) => {
    const { dateString } = date;
    setSelectedDate(dateString); // Keep track of selected date for potential UI feedback
    
    setUnavailableDates(prev => {
      const newUnavailable = { ...prev };
      if (newUnavailable[dateString]) {
        delete newUnavailable[dateString];
      } else {
        newUnavailable[dateString] = {textColor: 'white', startingDay: true, color: '#E57373', endingDay: true, disabled: true, disableTouchEvent: true }; // Mark as unavailable with red color
      }
      return newUnavailable;
    });
  };

  const handleSaveAvailability = async () => {
    try {
      setSaving(true);
      setError('');
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not authenticated.");
        setSaving(false);
        return;
      }
      
      await updateUserProfile(user.uid, { // Pass UID directly
        workingDays,
        workingHours,
        unavailableDates,
      });
      
      Alert.alert('Success', 'Availability settings saved successfully!');
    } catch (err) {
      console.error('Error saving availability:', err);
      Alert.alert('Error', 'Failed to save availability settings. Please try again.');
      setError('Failed to save availability settings');
    } finally {
      setSaving(false);
    }
  };

  const timeOptions = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  const intervalOptions = [15, 30, 45, 60, 90, 120];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading availability...</Text>
      </View>
    );
  }

  if (error && !profile) { // Show error prominently if profile couldn't be loaded
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfileData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Working Days</Text>
        <Text style={styles.sectionSubtitle}>Select the days you are available for appointments.</Text>
        <View style={styles.daysContainer}>
          {Object.entries(workingDays).map(([day, isWorking]) => (
            <View key={day} style={styles.dayRow}>
              <Text style={styles.dayText}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
              <Switch
                value={isWorking}
                onValueChange={() => handleDayToggle(day)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isWorking ? '#2196F3' : '#f4f3f4'}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Working Hours</Text>
        <Text style={styles.sectionSubtitle}>Set your regular working hours and appointment slot duration.</Text>
        <View style={styles.timeRow}>
          <View style={styles.timeColumn}>
            <Text style={styles.timeLabel}>Start Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timePicker}>
              {timeOptions.map((time) => (
                <TouchableOpacity
                  key={`start-${time}`}
                  style={[styles.timeOption, workingHours.start === time && styles.selectedTimeOption]}
                  onPress={() => setWorkingHours(prev => ({ ...prev, start: time }))}
                >
                  <Text style={[styles.timeOptionText, workingHours.start === time && styles.selectedTimeOptionText]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.timeColumn}>
            <Text style={styles.timeLabel}>End Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timePicker}>
              {timeOptions.map((time) => (
                <TouchableOpacity
                  key={`end-${time}`}
                  style={[styles.timeOption, workingHours.end === time && styles.selectedTimeOption]}
                  onPress={() => setWorkingHours(prev => ({ ...prev, end: time }))}
                >
                  <Text style={[styles.timeOptionText, workingHours.end === time && styles.selectedTimeOptionText]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
        <View style={styles.intervalContainer}>
          <Text style={styles.timeLabel}>Appointment Slot Duration (minutes)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timePicker}>
            {intervalOptions.map((interval) => (
              <TouchableOpacity
                key={`interval-${interval}`}
                style={[styles.timeOption, workingHours.interval === interval && styles.selectedTimeOption]}
                onPress={() => setWorkingHours(prev => ({ ...prev, interval }))}
              >
                <Text style={[styles.timeOptionText, workingHours.interval === interval && styles.selectedTimeOptionText]}>
                  {interval}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Set Specific Unavailable Dates</Text>
        <Text style={styles.sectionSubtitle}>Tap on dates in the calendar to mark them as unavailable.</Text>
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={unavailableDates} // Dates marked with { disabled: true, disableTouchEvent: true, customStyles: { container: { backgroundColor: 'red'}}} etc.
          minDate={new Date().toISOString().split('T')[0]}
          theme={{
            todayTextColor: '#2196F3',
            arrowColor: '#2196F3',
            dotColor: '#2196F3', // For marked dates if not using custom marking
            selectedDayBackgroundColor: '#2196F3',
            selectedDayTextColor: '#ffffff',
            // You can customize more theme properties here
            'stylesheet.calendar.header': {
              week: {
                marginTop: 5,
                flexDirection: 'row',
                justifyContent: 'space-between'
              }
            }
          }}
        />
        <Text style={styles.calendarHelpText}>
          Selected dates will be marked as unavailable.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={handleSaveAvailability}
        disabled={saving || loading} // Disable if loading profile too
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Availability</Text>
        )}
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, {marginTop: 10, marginBottom: 10}]}>{error}</Text>} 
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f2f5',
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
    marginTop: 20,
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 10, // Space between sections
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  daysContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 8,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayText: {
    fontSize: 16,
    color: '#444',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#444',
  },
  timePicker: {
    paddingVertical: 4,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 4, // Padding inside the scrollview
  },
  timeOption: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedTimeOption: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  intervalContainer: {
    marginTop: 16,
  },
  calendarHelpText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50', // Green for save
    paddingVertical: 15,
    marginHorizontal: 16,
    marginTop: 10, // Space from last section
    marginBottom: 20, // Space at bottom
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BarberAvailabilityScreen;

