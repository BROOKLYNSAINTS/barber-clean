import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { getUserProfile, updateUserProfile, auth } from '@/services/firebase';

const HORIZON_DAYS = 60;            // allow ~2 months
const DEFAULT_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00', '13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'
];

function buildNextDays(days = HORIZON_DAYS) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push(d);
  }
  return out;
}

function groupByMonth(days) {
  return days.reduce((acc, d) => {
    const key = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    (acc[key] = acc[key] || []).push(d);
    return acc;
  }, {});
}

const BarberAvailabilityScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [selectedDate, setSelectedDate] = useState(buildNextDays()[0]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Not signed in');
        return;
      }
      const data = await getUserProfile(user.uid);
      setProfile(data || {});
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dateKey = d => d.toISOString().split('T')[0];
  const availability = profile?.availability || {};
  const selectedKey = dateKey(selectedDate);
  const selectedSlots = availability[selectedKey] || [];

  function toggleSlot(slot) {
    const next = new Set(selectedSlots);
    next.has(slot) ? next.delete(slot) : next.add(slot);
    const updated = {
      ...availability,
      [selectedKey]: Array.from(next).sort()
    };
    setProfile(p => ({ ...(p || {}), availability: updated }));
  }

  async function save() {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;
      await updateUserProfile(user.uid, { availability: profile.availability });
      Alert.alert('Saved');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loading}>Loading availability...</Text>
      </View>
    );
  }

  const allDays = buildNextDays();
  const months = groupByMonth(allDays);

  // Add helper to copy selected week's pattern forward:
  function copyWeekForward() {
    const availability = profile.availability || {};
    const selKey = dateKey(selectedDate);
    const selDate = new Date(selectedDate);
    const startOfWeek = new Date(selDate);
    startOfWeek.setDate(selDate.getDate() - selDate.getDay()); // Sunday
    // Collect this week’s pattern map: dayOffset -> slots
    const weekPattern = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const k = dateKey(d);
      if (availability[k]?.length) weekPattern[i] = [...availability[k]];
    }
    if (!Object.keys(weekPattern).length) {
      Alert.alert('Nothing to copy', 'Set at least one day in this week first.');
      return;
    }
    // Apply pattern to all future weeks (within horizon)
    const updated = { ...availability };
    for (const day of allDays) {
      if (day <= startOfWeek) continue;
      const offset = day.getDay(); // same weekday index
      if (weekPattern[offset]) {
        updated[dateKey(day)] = [...weekPattern[offset]];
      }
    }
    setProfile(p => ({ ...p, availability: updated }));
    Alert.alert('Week pattern copied forward');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Availability</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.smallBtn} onPress={copyWeekForward}>
          <Text style={styles.smallBtnText}>Copy Week Forward</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtnDanger} onPress={() => {
          const k = dateKey(selectedDate);
          const updated = { ...(profile.availability||{}) };
          delete updated[k];
          setProfile(p => ({ ...p, availability: updated }));
        }}>
          <Text style={styles.smallBtnText}>Clear Day</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtnSave} disabled={saving} onPress={save}>
          <Text style={styles.smallBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ maxHeight: 260, marginBottom: 16 }}>
        {Object.entries(months).map(([label, daysInMonth]) => (
          <View key={label} style={{ marginBottom: 12 }}>
            <Text style={styles.monthLabel}>{label}</Text>
            <View style={styles.monthDaysWrap}>
              {daysInMonth.map(d => {
                const k = dateKey(d);
                const isSelected = k === selectedKey;
                  const has = (profile.availability?.[k] || []).length > 0;
                return (
                  <TouchableOpacity
                    key={k}
                    style={[
                      styles.dayBox,
                      isSelected && styles.dayBoxSelected,
                      !isSelected && has && styles.dayBoxHas
                    ]}
                    onPress={() => setSelectedDate(d)}
                  >
                    <Text style={[
                      styles.dayNum,
                      isSelected && styles.dayNumSelected
                    ]}>{d.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.section}>Time Slots</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  loading: { marginTop: 12, fontSize: 16 },
  actionsRow: { flexDirection: 'row', marginBottom: 12, flexWrap: 'wrap' },
  smallBtn: { backgroundColor: '#444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  smallBtnDanger: { backgroundColor: '#b3261e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  smallBtnSave: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  smallBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  monthLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  monthDaysWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  dayBox: {
    width: 38, height: 38, borderRadius: 8,
    backgroundColor: '#eee', alignItems: 'center',
    justifyContent: 'center', marginRight: 6, marginBottom: 6
  },
  dayBoxSelected: { backgroundColor: '#222' },
  dayBoxHas: { backgroundColor: '#d0e8ff' },
  dayNum: { fontSize: 14, fontWeight: '500', color: '#333' },
  dayNumSelected: { color: '#fff' },
  section: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  slotsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
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
  saveBtn: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center'
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});

export default BarberAvailabilityScreen;
