import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBarberAvailability, createAppointment, getUserProfile } from '@/services/firebase';
import { useRouter, useLocalSearchParams } from 'expo-router';

const DEFAULT_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30','18:00'
];

function buildNextDays(days = 30) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push(d);
  }
  return out;
}
const dateKey = d => d.toISOString().split('T')[0];

export default function AppointmentBookingScreen() {
  const { barberId } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [barberAvailability, setBarberAvailability] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [selectedDate, setSelectedDate] = useState(buildNextDays()[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      if (!barberId) {
        Alert.alert('Error', 'Missing barber ID');
        return;
      }
      const [avail, user] = await Promise.all([
        getBarberAvailability(barberId),
        getUserProfile(barberId) // if you meant current user, adjust to auth.currentUser.uid
      ]);
      setBarberAvailability(avail || {});
      setUserProfile(user || {});
    } catch (e) {
      Alert.alert('Load Error', e.message);
    } finally {
      setLoading(false);
    }
  }, [barberId]);

  useEffect(() => { load(); }, [load]);

  const days = useMemo(() => buildNextDays(30), []);
  const selectedKey = dateKey(selectedDate);

  const slotsForDay = useMemo(() => {
    const avail = barberAvailability?.[selectedKey];
    if (Array.isArray(avail) && avail.length) return avail;
    return DEFAULT_SLOTS; // fallback if none stored
  }, [barberAvailability, selectedKey]);

  async function submit() {
    if (!selectedSlot) {
      Alert.alert('Select a time slot first');
      return;
    }
    try {
      setSubmitting(true);
      const startISO = `${selectedKey}T${selectedSlot}:00.000Z`;
      await createAppointment({
        barberId,
        date: selectedKey,
        time: selectedSlot,
        start: startISO
      });
      Alert.alert('Success', 'Appointment booked.');
      router.back();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.header}>Book Appointment</Text>
        <View style={{ width: 32 }} />
      </View>

      <Text style={styles.section}>Select Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysRow}>
        {days.map(d => {
          const k = dateKey(d);
          const isSelected = k === selectedKey;
          return (
            <TouchableOpacity
              key={k}
              style={[styles.dayChip, isSelected && styles.dayChipSelected]}
              onPress={() => { setSelectedDate(d); setSelectedSlot(null); }}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                {d.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text style={[styles.dayDate, isSelected && styles.dayTextSelected]}>
                {d.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.section}>Available Times</Text>
      <View style={styles.slotsWrap}>
        {slotsForDay.map(slot => {
          const active = slot === selectedSlot;
          return (
            <TouchableOpacity
              key={slot}
              style={[styles.slot, active && styles.slotActive]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={[styles.slotText, active && styles.slotTextActive]}>{slot}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        disabled={!selectedSlot || submitting}
        style={[styles.submitBtn, (!selectedSlot || submitting) && styles.submitBtnDisabled]}
        onPress={submit}
      >
        <Text style={styles.submitText}>
          {submitting ? 'Booking...' : selectedSlot ? `Book ${selectedSlot}` : 'Select a Time'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  loading: { marginTop: 12, fontSize: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee',
    alignItems: 'center', justifyContent: 'center'
  },
  header: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '600' },
  section: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  daysRow: { marginBottom: 8 },
  dayChip: {
    width: 68, marginRight: 8, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#eee', alignItems: 'center'
  },
  dayChipSelected: { backgroundColor: '#222' },
  dayText: { fontSize: 12, color: '#555' },
  dayDate: { fontSize: 16, fontWeight: '600', color: '#333' },
  dayTextSelected: { color: '#fff' },
  slotsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  slot: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: '#f1f1f1', margin: 4
  },
  slotActive: { backgroundColor: '#2563eb' },
  slotText: { fontSize: 14, color: '#333' },
  slotTextActive: { color: '#fff', fontWeight: '500' },
  submitBtn: {
    marginTop: 24, backgroundColor: '#2563eb', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center'
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
