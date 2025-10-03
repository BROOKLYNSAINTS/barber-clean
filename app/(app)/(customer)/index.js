// app/(app)/(customer)/index.js

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, getRecentAppointmentsForUser } from '@/services/firebase';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [zip, setZip] = useState('');
  const [loadingAppt, setLoadingAppt] = useState(true);
  const [nextAppt, setNextAppt] = useState(null);

  const firstName = useMemo(() => {
    const n = user?.displayName || user?.email || 'Customer';
    return String(n).split(/[ @]/)[0];
  }, [user]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user?.uid) return;
        const appts = await getRecentAppointmentsForUser(user.uid, 1);
        if (mounted) setNextAppt(appts[0] || null);
      } finally {
        if (mounted) setLoadingAppt(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.uid]);

  const onSearch = () => {
    if (!zip.trim()) return;
    router.push({ pathname: '/(app)/(customer)/barber-selection', params: { zipcode: zip.trim() } });
  };

  const onBook = () => {
    router.push('/(app)/(customer)/barber-selection');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f8fa' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName?.[0]?.toUpperCase() || 'C'}</Text>
          </View>
        </View>

        {/* Search card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Find a Barber</Text>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter ZIP code"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={zip}
              onChangeText={setZip}
              returnKeyType="search"
              onSubmitEditing={onSearch}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
              <Text style={styles.searchBtnText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick action */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={onBook}>
            <Ionicons name="calendar" size={22} color="#fff" />
            <Text style={styles.actionText}>Book Again</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming appointment */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Next Appointment</Text>
        </View>
        <View style={styles.card}>
          {loadingAppt ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.muted}>Loading...</Text>
            </View>
          ) : nextAppt ? (
            <View style={styles.apptRow}>
              <View style={styles.apptIcon}>
                <Ionicons name="time" size={22} color="#2563EB" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.apptTitle} numberOfLines={1}>
                  {nextAppt.serviceName || 'Service'}
                </Text>
                <Text style={styles.apptSub}>
                  {nextAppt.date} • {nextAppt.time}
                </Text>
                {!!nextAppt.barberName && (
                  <Text style={styles.apptSub}>With {nextAppt.barberName}</Text>
                )}
              </View>
              <View>
                <Text style={styles.price}>
                  ${Number(nextAppt.servicePrice ?? nextAppt.price ?? 0).toFixed(2)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.muted}>No upcoming appointments</Text>
              <TouchableOpacity onPress={onBook} style={styles.linkBtn}>
                <Text style={styles.linkText}>Book one now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    flexGrow: 1,          // use full height
    paddingTop: 24,       // more breathing room
    paddingBottom: 32,    // bottom spacing
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  greeting: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  name: { color: '#111827', fontSize: 24, fontWeight: '800', marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,          // bigger card padding
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 10 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 20,       // increased size
    fontWeight: '800',  // bolder text
    color: '#111827',
  },
  searchBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  searchBtnText: { color: '#fff', fontWeight: '700' },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
  },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  sectionHeader: { marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },

  apptRow: { flexDirection: 'row', alignItems: 'center', gap: 16 }, // a bit more gap
  apptIcon: {
    width: 48, height: 48, borderRadius: 12,   // larger icon block
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  apptTitle: {
    fontSize: 20,          // larger service name (e.g., FADE)
    fontWeight: '800',
    color: '#111827',
  },
  apptSub: {
    fontSize: 16,          // larger and bold (under FADE)
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
    lineHeight: 20,
  },
  price: { fontSize: 20, fontWeight: '800', color: '#111827' },

  center: { alignItems: 'center', justifyContent: 'center' },
  muted: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  linkBtn: { marginTop: 6, paddingVertical: 6, paddingHorizontal: 10 },
  linkText: { color: '#2563EB', fontWeight: '800' },
});
