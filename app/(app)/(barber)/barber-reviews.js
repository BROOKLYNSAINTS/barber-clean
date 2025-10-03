import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getBarberReviews, auth } from '@/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BarberReviewsScreen() {
  const router = useRouter();
  const { barberId } = useLocalSearchParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // If no barberId is provided, use the currently logged in barber's ID
        const currentBarberId = barberId || auth.currentUser?.uid;
        
        if (!currentBarberId) {
          console.error('No barber ID available');
          if (mounted) setLoading(false);
          return;
        }
        
        const data = await getBarberReviews(String(currentBarberId));
        if (mounted) setReviews(data || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [barberId]);

  const avg = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length;
  }, [reviews]);

  const renderItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.row}>
        <Text style={styles.author}>{item.customerName || 'Anonymous'}</Text>
        <View style={styles.stars}>
          {[1,2,3,4,5].map(i => (
            <Ionicons key={i} name={i <= item.rating ? 'star' : 'star-outline'} size={22} color="#f59e0b" />
          ))}
        </View>
      </View>
      <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      {!!item.text && <Text style={styles.text}>{item.text}</Text>}
    </View>
  );
  
  // Helper function to format timestamps
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // If it's a Firebase timestamp
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      
      // If it's already a JS Date or timestamp string
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/(app)/(barber)/manage-services')} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>CUSTOMER REVIEWS</Text>
        <View style={styles.placeholder}></View>
      </View>
      
      <View style={styles.statsCard}>
        <View style={styles.ratingContainer}>
          <Text style={styles.avgRating}>{avg.toFixed(1)}</Text>
          <Ionicons name="star" size={32} color="#f59e0b" />
        </View>
        <Text style={styles.reviewCount}>
          {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </Text>
        
        <View style={styles.starsRow}>
          {[1,2,3,4,5].map(i => (
            <Ionicons key={i} name={i <= Math.round(avg) ? 'star' : 'star-outline'} size={28} color="#f59e0b" />
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : reviews.length ? (
        <FlatList 
          data={reviews} 
          keyExtractor={i => i.id} 
          renderItem={renderItem} 
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.center}>
          <Ionicons name="star-outline" size={64} color="#ccc" />
          <Text style={styles.empty}>NO REVIEWS YET</Text>
          <Text style={styles.emptySubtext}>When customers leave reviews, they'll appear here.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 44, // Same width as back button for balanced header
  },
  title: { 
    fontSize: 24, 
    fontWeight: '900',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avgRating: {
    fontSize: 48,
    fontWeight: '900',
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  empty: { 
    fontSize: 24, 
    fontWeight: '800',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: { 
    padding: 16, 
    paddingBottom: 30,
  },
  reviewCard: { 
    backgroundColor: '#fff',
    borderRadius: 12, 
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#000',
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center'
  },
  author: { 
    fontWeight: '800',
    fontSize: 18,
    color: '#000',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  stars: { 
    flexDirection: 'row', 
    gap: 2
  },
  text: { 
    marginTop: 12, 
    fontSize: 16, 
    color: '#000',
    lineHeight: 22,
  },
});