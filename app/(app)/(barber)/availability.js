import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { getUserProfile, auth, db } from '@/services/firebase';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';

const DEFAULT_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00'
];

// Format date as YYYY-MM-DD for the calendar
const formatDate = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

const BarberAvailabilityScreen = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [initialAvailability, setInitialAvailability] = useState({}); // add

  // Load user profile
  const load = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Not signed in');
        return;
      }
      const data = await getUserProfile(user.uid);
      setProfile(data || {});
      setInitialAvailability(data?.availability || {}); // add

      // Update calendar marked dates based on availability
      updateMarkedDates(data?.availability || {});
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Update marked dates for calendar display
  const updateMarkedDates = useCallback((availability) => {
    const marked = {};
    
    // Mark dates with availability
    Object.entries(availability || {}).forEach(([dateStr, slots]) => {
      if (slots && slots.length > 0) {
        marked[dateStr] = {
          marked: true,
          dotColor: '#2563eb',
          selectedColor: '#2563eb'
        };
      }
    });
    
    // Add selected date
    const selectedDateStr = formatDate(selectedDate);
    marked[selectedDateStr] = {
      ...marked[selectedDateStr],
      selected: true,
      selectedColor: profile?.availability?.[selectedDateStr]?.length > 0 ? '#2563eb' : '#666'
    };
    
    setMarkedDates(marked);
  }, [selectedDate, profile]);

  useEffect(() => {
    if (profile?.availability) {
      updateMarkedDates(profile.availability);
    }
  }, [profile?.availability, selectedDate, updateMarkedDates]);

  const dateKey = (d) => formatDate(d);
  const selectedKey = dateKey(selectedDate);
  const selectedSlots = profile?.availability?.[selectedKey] || [];

  // toggleSlot: remove the date key if no times remain
  function toggleSlot(slot) {
    const next = new Set(selectedSlots);
    next.has(slot) ? next.delete(slot) : next.add(slot);

    const updated = { ...(profile?.availability || {}) };
    if (next.size === 0) {
      delete updated[selectedKey]; // treat as day off (no key in DB)
    } else {
      updated[selectedKey] = Array.from(next).sort();
    }
    setProfile(p => ({ ...(p || {}), availability: updated }));
  }

  // save: upsert non-empty dates, delete empty/missing dates in Firestore
  async function save() {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const current = profile?.availability || {};
      const allKeys = new Set([
        ...Object.keys(initialAvailability || {}),
        ...Object.keys(current || {}),
      ]);

      // Persist each date atomically (small per-field updates)
      for (const k of allKeys) {
        const times = current[k];
        if (!times || times.length === 0) {
          await updateDoc(userRef, { [`availability.${k}`]: deleteField() });
        } else {
          // ensure unique + sorted
          const clean = Array.from(new Set(times)).sort();
          await updateDoc(userRef, { [`availability.${k}`]: clean });
        }
      }

      setInitialAvailability(current); // baseline after save
      Alert.alert('Success', 'Your availability has been saved.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  // Rename for clarity (was: copyWeekForward)
  function copyWeekToYear() {
    const availability = profile?.availability || {};
    const selDate = new Date(selectedDate);

    // Start of the selected week (Sunday)
    const startOfWeek = new Date(selDate);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(selDate.getDate() - selDate.getDay());

    // Collect this week's pattern
    const weekPattern = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const k = formatDate(d);
      if (availability[k]?.length) {
        weekPattern[i] = [...availability[k]];
      }
    }

    if (!Object.keys(weekPattern).length) {
      Alert.alert('Nothing to copy', 'Set at least one day in this week first.');
      return;
    }

    const updated = { ...availability };
    const today = new Date(); today.setHours(0,0,0,0);
    const endOfYear = new Date(selDate.getFullYear(), 11, 31);

    // Apply the pattern to every remaining week in this year
    for (let base = new Date(startOfWeek); base <= endOfYear; base.setDate(base.getDate() + 7)) {
      for (let day = 0; day < 7; day++) {
        const d = new Date(base);
        d.setDate(base.getDate() + day);
        if (d < today || d.getFullYear() !== selDate.getFullYear()) continue;

        const k = formatDate(d);
        if (weekPattern[day]) {
          updated[k] = [...weekPattern[day]];
        }
      }
    }

    setProfile(p => ({ ...p, availability: updated }));
    Alert.alert('Schedule Copied', 'This week’s schedule has been copied to all remaining weeks this year.');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loading}>Loading your availability...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Set Your Working Hours</Text>
        <Text style={styles.subtitle}>
          Select dates on the calendar, then mark which times you're available to work.
          Days with blue dots have time slots available.
        </Text>
      </View>

      {/* Calendar view */}
      <Calendar
        current={formatDate(selectedDate)}
        minDate={formatDate(new Date())}
        onDayPress={(day) => {
          // Fix timezone issue by using the date parts directly
          const selected = new Date(day.year, day.month - 1, day.day);
          setSelectedDate(selected);
        }}
        markedDates={markedDates}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#222222',
          selectedDayBackgroundColor: '#2563eb',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#2563eb',
          dayTextColor: '#222222',
          textDisabledColor: '#d9e1e8',
          dotColor: '#2563eb',
          selectedDotColor: '#ffffff',
          arrowColor: '#2563eb',
          monthTextColor: '#222222',
          indicatorColor: '#2563eb',
          textDayFontWeight: '400',
          textMonthFontWeight: '600',
          textDayHeaderFontWeight: '500'
        }}
        style={styles.calendar}
      />

      <View style={styles.selectedDateContainer}>
        <Text style={styles.selectedDateText}>
          <Ionicons name="calendar" size={18} /> {selectedDate.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </Text>
      </View>

      <Text style={styles.section}>Available Time Slots</Text>
      <Text style={styles.helpText}>Tap time slots to mark them as available.</Text>
      
      <View style={styles.slotsWrap}>
        {DEFAULT_SLOTS.map(slot => {
          const active = selectedSlots.includes(slot);
          return (
            <TouchableOpacity
              key={slot}
              onPress={() => toggleSlot(slot)}
              style={[styles.slot, active && styles.slotActive]}
            >
              <Text style={[styles.slotText, active && styles.slotTextActive]}>{slot}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.actionsContainer}>
        <View className="actionsRow" style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={copyWeekToYear}>
            <Ionicons name="copy" size={18} color="white" />
            <Text style={styles.actionBtnText}>Copy Week → Year</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
          disabled={saving} 
          onPress={save}
        >
          <Ionicons name="save" size={20} color="white" />
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Availability'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  title: { 
    fontSize: 24, 
    fontWeight: '600', 
    marginBottom: 8,
    color: '#111'
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20
  },
  calendar: {
    marginBottom: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    overflow: 'hidden'
  },
  selectedDateContainer: {
    backgroundColor: '#edf2ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  loading: { marginTop: 12, fontSize: 16, color: '#555' },
  section: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 4,
    color: '#222'
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic'
  },
  slotsWrap: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
  slot: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f1f1',
    margin: 4
  },
  slotActive: { backgroundColor: '#2563eb' },
  slotText: { fontSize: 14, color: '#333' },
  slotTextActive: { color: '#fff', fontWeight: '500' },
  actionsContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  actionsRow: { 
    flexDirection: 'row', 
    marginBottom: 16, 
    justifyContent: 'space-between'
  },
  actionBtn: { 
    backgroundColor: '#4b5563', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.48,
  },
  actionBtnText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '500',
    marginLeft: 6
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600',
    marginLeft: 8
  }
});

export default BarberAvailabilityScreen;
