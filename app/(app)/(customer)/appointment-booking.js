import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import {
  auth,
  db,
  getUserProfile,
  getBarberAvailability,
  bookAppointmentAndUpdateAvailability
} from '@/services/firebase';
import { scheduleAppointmentReminder } from '@/services/notifications';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// REMOVE the legacy to24Hour(...) helper entirely
// function to24Hour(timeStr = '') { ... }

// Keep and use this one everywhere
function normalizeTimeTo24h(raw = '') {
  const s = String(raw).replace(/[\u202F\u00A0]/g, ' ').trim();
  const cleaned = s.replace(/([AaPp])\.?\s*[Mm]\.?/g, (m, a) => ` ${a.toUpperCase()}M`).trim();
  const parts = cleaned.split(' ');
  const hhmm = parts[0] || '';
  const ampm = (parts[1] || '').toUpperCase(); // AM | PM | ''
  let [h, m] = hhmm.split(':');
  if (h == null) return '';
  if (m == null) m = '00';
  let hour = parseInt(h, 10);
  const min = parseInt(m, 10);
  if (Number.isNaN(hour) || Number.isNaN(min)) return '';
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// Helpers for time math (add below to24Hour)
const toMins = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const minsToHHMM = (mins) => `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;

export default function AppointmentBookingScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const scrollRef = useRef(null);
  const scrollViewRef = useRef(null);
  const [calendarY, setCalendarY] = useState(null);

  const barberId = params.barberId;
  const barberName = params.barberName || '';
  const serviceId = params.serviceId;              // NEW
  const serviceName = params.serviceName || '';    // NEW
  // Price safe default for display
  const servicePrice = Number(params.servicePrice ?? params.price ?? 0);
  // REQUIRED: duration must be provided by previous screen (no default)
  const serviceDurationRaw = params.serviceDuration ?? params.duration;
  const serviceDuration = Number(serviceDurationRaw);
  const durationValid = Number.isFinite(serviceDuration) && serviceDuration > 0;

  useEffect(() => {
    if (!barberId) {
      Alert.alert(
        'Missing Information',
        'Barber information is missing. Please go back and select a barber.',
        [{ text: 'Go Back', onPress: () => router.back() }]
      );
    }
  }, [barberId, router]);

  useEffect(() => {
    if (!durationValid) {
      Alert.alert(
        'Missing Service Duration',
        'Please select a service with a valid duration before booking.',
        [{ text: 'Go Back', onPress: () => router.back() }]
      );
    }
  }, [durationValid, router]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [barberAvailability, setBarberAvailability] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  // Derive a safe barber name (must be before any returns)
  const displayBarberName = useMemo(
    () => (userProfile?.name || barberName || '').trim(),
    [userProfile?.name, barberName]
  );
  const [availability, setAvailability] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [filteredSlots, setFilteredSlots] = useState([]); // display strings

  // Replace load() to pull dates/times from DB (no generated slots)
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [barberInfo, avail] = await Promise.all([
        getUserProfile(barberId),
        getBarberAvailability(barberId),
      ]);
      setUserProfile(barberInfo || {});
      setBarberAvailability({
        availableDates: avail.availableDates,
        allowedSlotsByDate: avail.allowedSlotsByDate,
      });
      const marked = {};
      avail.availableDates.forEach(d => { marked[d] = { marked: true, dotColor: 'green' }; });
      setMarkedDates(marked);
    } finally {
      setLoading(false);
    }
  }, [barberId]);

  useEffect(() => {
    if (!barberAvailability) return;
    const availableDatesArray = barberAvailability.availableDates || [];
    // REMOVE default generation – no defaults, only DB availability
    // if (availableDatesArray.length === 0) {
    //   generateDefaultAvailability();
    //   return;
    // }
    setAvailability(availableDatesArray);
    const marked = {};
    availableDatesArray.forEach(date => {
      marked[date] = { marked: true, dotColor: 'green' };
    });
    if (selectedKey) {
      marked[selectedKey] = {
        ...marked[selectedKey],
        selected: true,
        selectedColor: '#2196F3'
      };
    }
    setMarkedDates(marked);
  }, [barberAvailability, selectedKey]);

  const loadCurrentUserProfile = useCallback(async () => {
    try {
      if (auth.currentUser) {
        const userDoc = await getUserProfile(auth.currentUser.uid);
        setCurrentUserProfile(userDoc);
      }
    } catch (error) {
      // silent
    }
  }, []);

  // REMOVE bookedSlots loader – not used when availability is authoritative
  // const loadBookedSlots = useCallback(async (dateKey, barberId) => { ... }, []);

  // Use DB availability only (no generated defaults)
  // Only show starts that fit duration (uses raw24 from DB)
  const generateTimeSlots = useCallback((dateString) => {
    const raw24 = barberAvailability?.allowedSlotsByDate?.[dateString] || [];
    if (!raw24.length || !durationValid) { setTimeSlots([]); setFilteredSlots([]); return; }

    let interval = 30;
    for (let i = 1; i < raw24.length; i++) {
      const d = toMins(raw24[i]) - toMins(raw24[i - 1]);
      if (d > 0) interval = Math.min(interval, d);
    }
    const steps = Math.max(1, Math.ceil(serviceDuration / interval));
    const set24 = new Set(raw24);

    const validStarts = raw24.filter((start) => {
      const startM = toMins(start);
      for (let k = 0; k < steps; k++) {
        if (!set24.has(minsToHHMM(startM + k * interval))) return false;
      }
      return true;
    });

    const toDisplay = (hhmm) => {
      const [h, m] = hhmm.split(':').map(Number);
      const h12 = (h % 12) || 12;
      const ampm = h < 12 ? 'A.M.' : 'P.M.';
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const slots = validStarts.map(toDisplay);
    setTimeSlots(slots);
    setFilteredSlots(slots);
  }, [barberAvailability, durationValid, serviceDuration]);

  // When a day is selected, only allow dates present in availability
  const handleDayPress = useCallback((day) => {
    const selectedDate = day.dateString; // YYYY-MM-DD
    const times = barberAvailability?.allowedSlotsByDate?.[selectedDate];

    // If the barber did not populate this date with times, treat as day off
    if (!Array.isArray(times) || times.length === 0) {
      Alert.alert('barber day off');
      setSelectedKey(null);
      setSelectedSlot(null);
      setTimeSlots([]);
      setFilteredSlots([]);
      return;
    }

    setSelectedKey(selectedDate);
    setSelectedSlot(null);
    generateTimeSlots(selectedDate);
  }, [barberAvailability, generateTimeSlots]);

  // Since availability is authoritative, filteredSlots === generated timeSlots
  useEffect(() => {
    if (!selectedKey) return;
    setFilteredSlots(timeSlots);
  }, [selectedKey, timeSlots]);

  // Simplify time selection: if it's shown, it's selectable
  const handleSelectTimeSlot = (slot) => {
    setSelectedSlot(slot);
  };

  // Robust customer name derivation
  const getCustomerName = () => {
    const authName = auth.currentUser?.displayName;
    const profile = currentUserProfile || {};
    const nameFields = [
      profile.name,
      [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim(),
      authName,
      profile.username,
      auth.currentUser?.email
    ].filter(Boolean);
    return nameFields[0] || 'Customer';
  };

  // Submit: book and atomically remove time(s) from availability
  // Replace submit with revalidation using the same logic
  const submit = async () => {
    try {
      if (!durationValid) { Alert.alert('Missing Service Duration', 'Please select a service with a valid duration.'); return; }
      if (!selectedKey || !selectedSlot) { Alert.alert('Select Time', 'Please select a date and time.'); return; }
      setSubmitting(true);

      // IMPROVED TIME VALIDATION: Fix "A.M." vs "AM" format issues
      
      // Convert selected time from display format ("10:30 A.M.") to 24h ("10:30") 
      const time24 = (() => {
        const time = selectedSlot || '';
        // Match time with or without periods in AM/PM
        const match = time.match(/(\d{1,2}):(\d{2})\s*([AaPp]\.?[Mm]\.?)/);
        if (!match) return null;
        
        let [_, hours, minutes, period] = match;
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        
        // Handle PM conversion
        if (period.toLowerCase().includes('p') && hours !== 12) {
          hours += 12;
        }
        // Handle 12 AM -> 00
        if (period.toLowerCase().includes('a') && hours === 12) {
          hours = 0;
        }
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      })();
      
      console.log('BOOKING TIME DEBUG:', { 
        selectedSlot, 
        time24, 
        availableTimes: barberAvailability?.allowedSlotsByDate?.[selectedKey] || []
      });

      // Check if converted 24h time is in available slots
      if (!time24 || !(barberAvailability?.allowedSlotsByDate?.[selectedKey] || []).includes(time24)) {
        Alert.alert('Time unavailable', 'This time slot is no longer available. Please select another time.');
        setSubmitting(false);
        return;
      }
      
      // Proceed with the booking
      const customerName = getCustomerName();
      const resolvedBarberName = displayBarberName;

      const { id: appointmentId } = await bookAppointmentAndUpdateAvailability({
        barberId,
        customerId: auth.currentUser?.uid,
        customerName,
        serviceId,
        serviceName,
        price: servicePrice,
        duration: serviceDuration,
        date: selectedKey,
        time: selectedSlot,
        barberName: resolvedBarberName,
      });

      // Schedule reminders
      const appt = {
        id: appointmentId,
        barberId,
        barberName: resolvedBarberName, // use resolved name
        serviceId,
        serviceName,
        servicePrice: Number(servicePrice),
        price: Number(servicePrice),
        duration: Number(serviceDuration),
        date: selectedKey,
        time: selectedSlot,
      };
      await scheduleAppointmentReminder(appt, auth.currentUser?.uid);

      // Optimistic local removal
      setBarberAvailability(prev => {
        const map = { ...(prev?.allowedSlotsByDate || {}) };
        const current = map[selectedKey] ? [...map[selectedKey]] : [];
        if (!current.length) return prev;

        let localInterval = 30;
        for (let i = 1; i < current.length; i++) {
          const d = toMins(current[i]) - toMins(current[i - 1]);
          if (d > 0) localInterval = Math.min(localInterval, d);
        }
        const localSteps = Math.max(1, Math.ceil(serviceDuration / localInterval));
        const s24 = normalizeTimeTo24h(selectedSlot);
        const startMLocal = toMins(s24);
        const consume = Array.from({ length: localSteps }, (_, k) => minsToHHMM(startMLocal + k * localInterval));
        const remaining = current.filter(t => !consume.includes(t));
        if (remaining.length) map[selectedKey] = remaining; else delete map[selectedKey];

        return { ...prev, allowedSlotsByDate: map, availableDates: Object.keys(map).sort() };
      });

      Alert.alert('Booked', 'Your appointment has been created.');
      router.replace({
        pathname: '/(app)/(customer)/appointment-confirmation',
        params: {
          appointmentId,
          barberId,
          barberName: resolvedBarberName, // use resolved name
          serviceId,
          serviceName,
          servicePrice: String(servicePrice),
          serviceDuration: String(serviceDuration),
          date: selectedKey,
          time: selectedSlot,
        },
      });
    } catch (e) {
      console.error('Booking failed:', e);
      Alert.alert('Booking failed', e.message || 'There was a problem booking your appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Ensure load runs on mount
  useEffect(() => {
    load();
    loadCurrentUserProfile();
  }, [load, loadCurrentUserProfile]);

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  const isDateDisabled = (dateString) => {
    // Disable dates not in availability
    if (!barberAvailability?.allowedSlotsByDate) return true;
    return !Object.keys(barberAvailability.allowedSlotsByDate).includes(dateString);
  };

  const formatPrice = (value) => Number(value ?? 0).toFixed(2);

  // REMOVE the duplicate hook below (was causing hook order mismatch)
  // const displayBarberName = useMemo(
  //   () => (userProfile?.name || barberName || '').trim(),
  //   [userProfile?.name, barberName]
  // );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Book Appointment</Text>
        <Text style={styles.subtitle}>{serviceName} with {displayBarberName}</Text>

        <View style={styles.calendarContainer}>
          <RNCalendar
            // Always allow day press; handleDayPress will show "barber day off" if needed
            onDayPress={handleDayPress}
            markedDates={markedDates}
            horizontal={true}
            pagingEnabled={true}
            style={styles.calendar}
          />
        </View>

        <View style={styles.timeSlotsContainer}>
          {timeSlots.length === 0 && (
            <Text style={styles.noTimeSlotsText}>
              {!durationValid
                ? 'Select a service with a valid duration to see times'
                : selectedKey
                  ? 'No available times'
                  : 'Select a date to see available times'}
            </Text>
          )}
          {timeSlots.length > 0 && (
            <View style={styles.timeSlotButtons}>
              {filteredSlots.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  onPress={() => handleSelectTimeSlot(slot)}
                  style={[
                    styles.timeSlotButton,
                    selectedSlot === slot && styles.selectedTimeSlotButton
                  ]}
                  disabled={submitting}
                >
                  <Text style={styles.timeSlotButtonText}>{slot}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Appointment Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service:</Text>
            <Text style={styles.detailValue}>{serviceName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Barber:</Text>
            <Text style={styles.detailValue}>{displayBarberName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{selectedKey}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{selectedSlot}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>${formatPrice(servicePrice)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>
              {durationValid ? `${serviceDuration} min` : '—'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={submit}
          style={styles.bookButton}
          disabled={submitting || !durationValid}
        >
          <Text style={styles.bookButtonText}>
            {submitting ? 'Booking...' : 'Book Appointment'}
          </Text>
        </TouchableOpacity>

        {submitting && (
          <ActivityIndicator size="small" style={styles.submittingIndicator} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  calendarContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
  },
  calendar: {
    // height: 350,
    // paddingTop: 8,
    // paddingBottom: 8,
  },
  timeSlotsContainer: {
    marginBottom: 24,
  },
  noTimeSlotsText: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 16,
  },
  timeSlotButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  timeSlotButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
  },
  selectedTimeSlotButton: {
    backgroundColor: '#2196F3',
  },
  timeSlotButtonText: {
    fontSize: 16,
    color: '#333',
  },
  detailsContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#555',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  submittingIndicator: {
    marginTop: 8,
  },
});
