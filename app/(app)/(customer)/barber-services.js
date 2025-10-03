import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBarberServices, getBarberReviews } from '@/services/firebase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import DebugUser from '@/components/DebugUser';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/services/firebase';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';

const db = getFirestore(app);

export default function BarberServicesScreen() {
  const { barberId, barberName, barber: barberJson } = useLocalSearchParams();
  const router = useRouter();
  const [barber, setBarber] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const [imageUri, setImageUri] = useState(null);

  // Parse barber from route once
  useEffect(() => {
    try {
      if (barberJson) {
        const parsed = JSON.parse(barberJson);
        setBarber(parsed);
      } else {
        setBarber(prev => prev ?? { id: barberId, name: barberName });
      }
    } catch {
      setBarber({ id: barberId, name: barberName });
    }
  }, [barberJson, barberId, barberName]);

  const ratingAvg = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  // FIX: remove undefined "params" log
  // console.log('Barber services screen params:', params);
  console.log('Barber services route:', { barberId, barberName });
  console.log('Using barber data:', barber);

  // Ensure we have a barber ID
  useEffect(() => {
    if (!barber?.id && !barberId) {
      console.error('No barber ID available');
      Alert.alert(
        'Error',
        'Could not find barber information. Please try again.',
        [{ text: 'Go Back', onPress: () => router.back() }]
      );
    }
  }, [barber, barberId, router]);

  // FIX: fetch services and reviews using the resolved ID (no parsedBarber)
  useEffect(() => {
    const id = barber?.id || barberId;
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const servicesData = await getBarberServices(id);
        setServices(servicesData || []);
        console.log('📦 Services Data for Barber ID', id, ':', servicesData);

        // Show spinner in header while reviews load
        setReviewsLoading(true);
        const reviewsData = await getBarberReviews(id);
        setReviews(reviewsData || []);
        setReviewsLoading(false);
        console.log('🗒️ Reviews Data for Barber ID', id, ':', reviewsData);

        // Ensure barber object exists and attach reviewCount
        setBarber(prev => ({
          ...(prev || { id, name: barberName }),
          reviewCount: (reviewsData || []).length,
        }));
      } catch (err) {
        console.error('Error fetching barber data:', err);
        setError('Failed to load barber information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [barber?.id, barberId, barberName]);

  const handleSelectService = (service) => {
    const selectedBarberId = barber?.id || barberId;
    if (!selectedBarberId) {
      Alert.alert('Error', 'Missing barber information');
      return;
    }

    // Require valid duration and price
    const hasDuration = Number.isFinite(Number(service.duration)) && Number(service.duration) > 0;
    const hasPrice = Number.isFinite(Number(service.price)) && Number(service.price) >= 0;

    if (!hasDuration) {
      Alert.alert('Missing Duration', 'This service has no duration set. Please select another service.');
      return;
    }
    if (!hasPrice) {
      Alert.alert('Missing Price', 'This service has no price set. Please select another service.');
      return;
    }

    router.push({
      pathname: '/(app)/(customer)/appointment-booking',
      params: {
        barberId: selectedBarberId,
        barberName: barber?.name || barberName,
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: String(service.price),
        serviceDuration: String(service.duration) // REQUIRED
      }
    });
  };

  const renderServiceItem = ({ item }) => {
    const img = item.photo || item.photoUrl || 'https://via.placeholder.com/48';
    const durationNum = Number(item.duration);
    const priceNum = Number(item.price);

    return (
      <TouchableOpacity style={styles.serviceRow} onPress={() => handleSelectService(item)}>
        <Image source={{ uri: img }} style={styles.serviceThumb} />

        <Text style={styles.serviceRowName} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.metaPill}>
          <Ionicons name="time-outline" size={14} color="#555" />
          <Text style={styles.metaText}>
            {Number.isFinite(durationNum) ? `${durationNum} min` : '—'}
          </Text>
        </View>

        <View style={styles.metaPill}>
          <Ionicons name="pricetag-outline" size={14} color="#555" />
          <Text style={styles.metaText}>
            {Number.isFinite(priceNum) ? `$${priceNum.toFixed(2)}` : '—'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#2196F3" />
      </TouchableOpacity>
    );
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{item.customerName || 'Anonymous'}</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= item.rating ? 'star' : 'star-outline'}
              size={16}
              color="#FFD700"
            />
          ))}
        </View>
        <Text style={styles.reviewDate}>
          {item.createdAt
            ? new Date(item.createdAt.seconds ? item.createdAt.toDate() : item.createdAt).toLocaleDateString()
            : 'N/A'}
        </Text>
      </View>
      <Text style={styles.reviewText}>{item.text}</Text>
    </View>
  );

  // Resolve barber image from multiple possible fields and gs:// URLs
  useEffect(() => {
    const urlCandidate =
      barber?.image ||
      barber?.imageUrl ||
      barber?.photo ||
      barber?.photoURL ||
      barber?.avatar ||
      barber?.avatarUrl ||
      barber?.profileImage ||
      null;

    let cancelled = false;

    const resolveImage = async () => {
      try {
        if (!urlCandidate) {
          if (!cancelled) setImageUri(null);
          return;
        }
        if (urlCandidate.startsWith('gs://')) {
          const storage = getStorage(app);
          const ref = storageRef(storage, urlCandidate);
          const dl = await getDownloadURL(ref);
          if (!cancelled) setImageUri(dl);
        } else {
          if (!cancelled) setImageUri(urlCandidate);
        }
      } catch (e) {
        console.warn('Failed to resolve barber image URL:', e?.message || e);
        if (!cancelled) setImageUri(null);
      }
    };

    resolveImage();
    return () => { cancelled = true; };
  }, [barber]);

  if (!barber) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
        <Text style={styles.errorText}>{error || 'Barber data not found.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: imageUri || 'https://via.placeholder.com/120' }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.barberName}>{barber?.name || barberName || 'Barber'}</Text>
          {reviewsLoading ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text style={styles.reviewsText}>
              {reviews.length > 0 ? `⭐ ${ratingAvg.toFixed(1)} • ${reviews.length} reviews` : 'No reviews yet'}
            </Text>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'services' && styles.activeTabButton]}
          onPress={() => setActiveTab('services')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'services' && styles.activeTabButtonText]}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'reviews' && styles.activeTabButton]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'reviews' && styles.activeTabButtonText]}>Reviews</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading barber information...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : activeTab === 'services' ? (
        services.length > 0 ? (
          <FlatList
            data={services}
            renderItem={renderServiceItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.centered}>
            <Ionicons name="cut-outline" size={64} color="#ccc" />
            <Text style={styles.noDataText}>No services available</Text>
          </View>
        )
      ) : reviews.length > 0 ? (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.centered}>
          <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
          <Text style={styles.noDataText}>No reviews yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', padding: 16, alignItems: 'center', backgroundColor: '#fff' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eee' },
  headerInfo: { marginLeft: 12, flex: 1 },
  barberName: { fontSize: 18, fontWeight: '700', color: '#222' },
  reviewsText: { marginTop: 4, color: '#666' },
  barberHeader: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  barberImageContainer: { marginRight: 12 },
  barberImage: { width: 80, height: 80, borderRadius: 40 },
  barberImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barberImagePlaceholderText: { fontSize: 24, color: '#fff' },
  barberInfo: { flex: 1, justifyContent: 'center' },
  barberAddress: { fontSize: 14, color: '#777' },
  barberPhone: { fontSize: 14, color: '#777' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 14, marginRight: 4 },
  reviewCount: { fontSize: 14, color: '#777', marginLeft: 4 },
  tabContainer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  tabButton: { marginHorizontal: 16 },
  tabButtonText: { fontSize: 16, color: '#888' },
  activeTabButton: { borderBottomWidth: 2, borderBottomColor: '#2196F3' },
  activeTabButtonText: { color: '#2196F3', fontWeight: 'bold' },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 24,   // was 12 → taller row
    minHeight: 80,         // ensure roughly double height
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  serviceThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  serviceRowName: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '700',     // was '600' → bold
    color: '#222',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#eef3ff',
    borderRadius: 12,
  },
  metaText: {
    fontSize: 16,         // was 12 → larger font for duration/price
    color: '#333',
    fontWeight: '700',
  },
  reviewCard: { padding: 16, marginHorizontal: 16, marginVertical: 8, backgroundColor: '#f2f2f2', borderRadius: 8 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewAuthor: { fontWeight: 'bold' },
  reviewDate: { fontSize: 12, color: '#999' },
  reviewText: { fontSize: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  errorText: { color: '#f44336', fontSize: 16, marginBottom: 8 },
  retryButton: { padding: 10, backgroundColor: '#2196F3', borderRadius: 5 },
  retryButtonText: { color: '#fff' },
  loadingText: { marginTop: 12, fontSize: 16 },
  noDataText: { fontSize: 16, color: '#888', marginTop: 12 },
  listContainer: { paddingBottom: 16 },
});

