import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAppointmentsByBarber, getUserProfile, auth } from '@/services/firebase';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

const BarberDashboardScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const user = auth.currentUser;
      console.log('🔍 Fetching user profile for UID:', user?.uid);

      if (!user) {
        setError('User not authenticated.');
        router.replace('/(auth)/login');
        setLoading(false);
        return;
      }
      
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      
      if (userProfile && userProfile.role !== 'barber') {
        setError('Access denied. This dashboard is for barbers only.');
        setLoading(false);
        return;
      }

      const appointmentsData = await getAppointmentsByBarber(user.uid) || [];

      appointmentsData.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
      });

      setAppointments(appointmentsData);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      const todayAppts = appointmentsData.filter(appt => appt.date === today);
      setTodayAppointments(todayAppts);

      const upcoming = appointmentsData.filter(appt => {
        const appointmentDateTime = new Date(`${appt.date}T${appt.time}`);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return appointmentDateTime >= todayStart && appt.date !== today;
      });
      setUpcomingAppointments(upcoming.slice(0, 5));
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard information. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string' || !dateString.includes('-')) return 'N/A';
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const [year, month, day] = dateString.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return 'N/A';
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#000" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 20 : 30 }]}>
        <Text style={styles.welcomeText}>WELCOME, {(profile?.name || 'BARBER').toUpperCase()}</Text>
        
        {profile?.subscription?.status === 'active' ? (
          <View style={styles.subscriptionActive}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.subscriptionActiveText}>ACTIVE</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.subscriptionInactive}
            onPress={() => router.push('/(app)/(barber)/subscription-payment')}
          >
            <Ionicons name="alert-circle" size={24} color="#fff" />
            <Text style={styles.subscriptionInactiveText}>INACTIVE</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayAppointments.length}</Text>
            <Text style={styles.statLabel}>TODAY</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{upcomingAppointments.length}</Text>
            <Text style={styles.statLabel}>UPCOMING</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{appointments.length}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
        </View>

        {/* No Appointments Message */}
        {appointments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>NO APPOINTMENTS YET</Text>
            <Text style={styles.emptyText}>Share your booking link or set up your services to get started!</Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(app)/(barber)/services')}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>ADD SERVICES</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Appointments */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S APPOINTMENTS</Text>
            {todayAppointments.length > 0 && 
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push('/(app)/(barber)/all-appointments?filter=today')}
              >
                <Text style={styles.seeAllText}>SEE ALL</Text>
                <Ionicons name="chevron-forward" size={20} color="#000" />
              </TouchableOpacity>
            }
          </View>

          {todayAppointments.length > 0 ? (
            todayAppointments.map(item => (
              <TouchableOpacity 
                key={item.id + "-today"}
                style={styles.appointmentCard}
                onPress={() => router.push({
                  pathname: '/(app)/(barber)/appointment-details',
                  params: { appointment: JSON.stringify(item) }
                })}
              >
                <View style={styles.appointmentContent}>
                  <View style={styles.appointmentTime}>
                    <Text style={styles.timeText}>{item.time}</Text>
                    <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                  </View>
                  
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.customerName}>{item.customerName || 'N/A'}</Text>
                    <Text style={styles.serviceName}>{item.serviceName || 'N/A'}</Text>
                    <Text style={styles.servicePrice}>${item.servicePrice?.toFixed(2) || '0.00'}</Text>
                  </View>
                  
                  <View style={styles.appointmentAction}>
                    <Ionicons name="chevron-forward" size={32} color="#000" />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyAppointments}>
              <Ionicons name="calendar-outline" size={64} color="#000" />
              <Text style={styles.emptyAppointmentsText}>NO APPOINTMENTS TODAY</Text>
            </View>
          )}
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>UPCOMING APPOINTMENTS</Text>
            {upcomingAppointments.length > 0 && 
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push('/(app)/(barber)/all-appointments?filter=upcoming')}
              >
                <Text style={styles.seeAllText}>SEE ALL</Text>
                <Ionicons name="chevron-forward" size={20} color="#000" />
              </TouchableOpacity>
            }
          </View>

          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map(item => (
              <TouchableOpacity 
                key={item.id + "-upcoming"}
                style={styles.appointmentCard}
                onPress={() => router.push({
                  pathname: '/(app)/(barber)/appointment-details',
                  params: { appointment: JSON.stringify(item) }
                })}
              >
                <View style={styles.appointmentContent}>
                  <View style={styles.appointmentTime}>
                    <Text style={styles.timeText}>{item.time}</Text>
                    <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                  </View>
                  
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.customerName}>{item.customerName || 'N/A'}</Text>
                    <Text style={styles.serviceName}>{item.serviceName || 'N/A'}</Text>
                    <Text style={styles.servicePrice}>${item.servicePrice?.toFixed(2) || '0.00'}</Text>
                  </View>
                  
                  <View style={styles.appointmentAction}>
                    <Ionicons name="chevron-forward" size={32} color="#000" />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyAppointments}>
              <Ionicons name="calendar-outline" size={64} color="#000" />
              <Text style={styles.emptyAppointmentsText}>NO UPCOMING APPOINTMENTS</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(app)/(barber)/manage-availability')}
            >
              <Ionicons name="calendar" size={32} color="#fff" />
              <Text style={styles.quickActionText}>AVAILABILITY</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(app)/(barber)/services')}
            >
              <Ionicons name="cut-outline" size={32} color="#fff" />
              <Text style={styles.quickActionText}>SERVICES</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  errorText: {
    marginTop: 15,
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 25,
    backgroundColor: '#000',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#000',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  subscriptionActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  subscriptionActiveText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '900',
    fontSize: 16,
  },
  subscriptionInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  subscriptionInactiveText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '900',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    marginTop: 0,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#000',
    borderRadius: 12,
    marginHorizontal: 6,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4, 
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
  },
  seeAllText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
    marginRight: 4,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    borderWidth: 3,
    borderColor: '#000',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  appointmentCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
  },
  appointmentContent: {
    flexDirection: 'row',
    padding: 16,
  },
  appointmentTime: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 2,
    borderRightColor: '#000',
    paddingRight: 12,
    marginRight: 16,
  },
  timeText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginTop: 4,
  },
  appointmentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
  },
  serviceName: {
    fontSize: 18,
    color: '#000',
    marginTop: 4,
    fontWeight: '600',
  },
  servicePrice: {
    fontSize: 20,
    color: '#000',
    fontWeight: '800',
    marginTop: 5,
  },
  appointmentAction: {
    justifyContent: 'center',
    paddingLeft: 10,
  },
  emptyAppointments: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#000',
  },
  emptyAppointmentsText: {
    color: '#000',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
  },
  quickActionsContainer: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 0,
  },
  quickActionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '800',
    marginLeft: 10,
    fontSize: 18,
  },
});

export default BarberDashboardScreen;

