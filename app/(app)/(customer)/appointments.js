import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCustomerAppointments, auth } from '@/services/firebase'; // Adjusted path
import { useRouter, useFocusEffect } from 'expo-router';

const AppointmentsScreen = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const user = auth.currentUser;
      if (user) {
        // Assuming getCustomerAppointments fetches appointments for the logged-in customer
        const appointmentsData = await getCustomerAppointments(user.uid);
        
        // Filter out cancelled appointments
        const activeAppointments = appointmentsData.filter(appointment => 
          appointment.status !== 'cancelled'
        );
        
        activeAppointments.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB - dateA;
        });
        
        setAppointments(activeAppointments);
      } else {
        setError('User not authenticated');
        // Optionally redirect to login if user is not found
         router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    if (!dateString || typeof dateString !== 'string' || !dateString.includes('-')) return 'N/A';
    // Parse as local date to avoid UTC shift bug
    const [year, month, day] = dateString.split('-').map(Number);
    if (
      isNaN(year) ||
      isNaN(month) ||
      isNaN(day)
    ) return 'N/A';
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString(undefined, options);
  };

  const isUpcoming = (appointment) => {
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    return appointmentDate > new Date();
  };

  const renderAppointmentItem = ({ item }) => {
    const upcoming = isUpcoming(item);
    
    return (
      <TouchableOpacity 
        style={[
          styles.appointmentCard,
          upcoming ? styles.upcomingCard : styles.pastCard
        ]}
        onPress={() => handleAppointmentPress(item)}
        activeOpacity={0.7}
        delayPressIn={0}
      >
        <View style={styles.appointmentHeader}>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator,
              upcoming ? styles.upcomingIndicator : styles.pastIndicator
            ]} />
            <Text style={styles.statusText}>
              {upcoming ? 'Upcoming' : 'Past'}
            </Text>
          </View>
        </View>
        
        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.barberName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="cut-outline" size={16} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.serviceName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {(item.price) != null 
                ? `$${(item.price).toFixed(2)}` 
                : 'No price'}
            </Text>
          </View>
        </View>
        
        <View style={styles.appointmentFooter}>
          <Ionicons name="chevron-forward" size={20} color="#2196F3" />
        </View>
      </TouchableOpacity>
    );
  };

  const handleAppointmentPress = (appointment) => {
    try {
      if (!appointment || !appointment.id) {
        console.error('Invalid appointment data - missing ID');
        return;
      }
      
      // Just pass the ID - we'll fetch the full data in the details screen
      console.log('Navigating to appointment details with ID:', appointment.id);
      router.push({
        pathname: '/(app)/(customer)/appointment-details',
        params: { id: appointment.id }
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  if (error && !loading) { // Show error only if not loading
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchAppointments}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (appointments.length === 0 && !loading) { // Show no appointments only if not loading and no error
    return (
      <View style={styles.centered}>
        <Ionicons name="calendar-outline" size={64} color="#ccc" />
        <Text style={styles.noAppointmentsText}>No appointments found</Text>
        <TouchableOpacity 
          style={styles.bookButton}
          // BarberSelectionScreen is now (app)/(customer)/index.js
          onPress={() => router.push('/(app)/(customer)/')}
        >
          <Text style={styles.bookButtonText}>Book an Appointment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.statusBarSpacer} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
      </View>
      
      <ScrollView 
        style={{flex: 1}}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
      >
        {appointments.map(item => (
          <TouchableOpacity 
            key={item.id}
            style={[
              styles.appointmentCard,
              isUpcoming(item) ? styles.upcomingCard : styles.pastCard
            ]}
            onPress={() => handleAppointmentPress(item)}
          >
            <View style={styles.appointmentHeader}>
              <View style={styles.dateTimeContainer}>
                <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>
              
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusIndicator,
                  isUpcoming(item) ? styles.upcomingIndicator : styles.pastIndicator
                ]} />
                <Text style={styles.statusText}>
                  {isUpcoming(item) ? 'Upcoming' : 'Past'}
                </Text>
              </View>
            </View>
            
            <View style={styles.appointmentDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailText}>{item.barberName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="cut-outline" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailText}>{item.serviceName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={16} color="#666" style={styles.detailIcon} />
                <Text style={styles.detailText}>
                  {(item.price) != null 
                    ? `$${(item.price).toFixed(2)}` 
                    : 'No price'}
                </Text>
              </View>
            </View>
            
            <View style={styles.appointmentFooter}>
              <Ionicons name="chevron-forward" size={20} color="#2196F3" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push('/(app)/(customer)/')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // This is important
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
  noAppointmentsText: {
    marginTop: 10,
    fontSize: 22, // Larger
    fontWeight: '600', // Semi-bold
    color: '#555',
    marginBottom: 20,
  },
  bookButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20, // More padding
    paddingVertical: 14, // More padding
    borderRadius: 10, // More rounded
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '800', // Bolder
    fontSize: 18, // Larger
  },
  listContainer: {
    padding: 16,
  },
  // Keep the card size the same
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginVertical: 18,
    marginHorizontal: 6,
    borderWidth: 3,
    overflow: 'visible',
    height: 240, // Keep existing height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  upcomingCard: {
    borderColor: '#2196F3', // Vibrant blue
  },
  pastCard: {
    borderColor: '#9E9E9E', // More distinct gray
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 22, // Much more padding
    backgroundColor: '#f5f9ff',
    borderBottomWidth: 3, // Thicker separator
    borderBottomColor: '#e0e0e0',
  },
  dateTimeContainer: {
    flexDirection: 'column',
  },
  dateText: {
    fontSize: 22, // Slightly smaller than 24
    fontWeight: '800',
    color: '#111',
  },
  timeText: {
    fontSize: 20, // Slightly smaller than 22
    fontWeight: '600',
    color: '#333',
    marginTop: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8, // Taller
    paddingHorizontal: 14, // Wider
    borderRadius: 18, // More rounded
  },
  statusIndicator: {
    width: 16, // Larger indicator
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  upcomingIndicator: {
    backgroundColor: '#4CAF50',
  },
  pastIndicator: {
    backgroundColor: '#9e9e9e',
  },
  statusText: {
    fontSize: 16, // Smaller than 18
    fontWeight: '700',
    color: '#333',
  },
  appointmentDetails: {
    padding: 18, // Slightly less than 22
    paddingTop: 20, // Slightly less than 24
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14, // Slightly less than 18
  },
  detailIcon: {
    marginRight: 12,
    fontSize: 22, // Slightly smaller than 26
    color: '#444',
  },
  detailText: {
    fontSize: 18, // Smaller than 22
    fontWeight: '600',
    color: '#222',
  },
  appointmentFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 12,
    alignItems: 'flex-end',
  },

  // Floating button
  floatingButton: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    width: 70, // Larger button
    height: 70, // Larger button
    borderRadius: 35, // Keep it circular
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // More prominent
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  // Header styles
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 2, // Thicker border
    borderBottomColor: '#2196F3', // Matching color
  },
  headerTitle: {
    fontSize: 28, // Larger header
    fontWeight: '800',
    color: '#2196F3',
    padding: 6, // Add some padding
  },
});

export default AppointmentsScreen;
