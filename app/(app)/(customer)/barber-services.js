import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBarberServices, getBarberReviews } from '@/services/firebase'; // Adjusted path
import { useRouter, useLocalSearchParams } from 'expo-router';

const BarberServicesScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  // Safely parse barber data, assuming it's passed as a JSON string
  const barber = params.barber ? JSON.parse(params.barber) : null;
  
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => {
    if (barber && barber.id) {
      fetchData(barber.id);
    } else {
      setError('Barber information is missing.');
      setLoading(false);
    }
  }, [barber]);

  const fetchData = async (barberId) => {
    try {
      setLoading(true);
      setError('');
      
      const servicesData = await getBarberServices(barberId);
      setServices(servicesData);
      
      const reviewsData = await getBarberReviews(barberId);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching barber data:', error);
      setError('Failed to load barber information');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectService = (service) => {
    if (!barber) return; // Should not happen if barber is validated
    router.push({
      pathname: '/(app)/(customer)/appointment-booking',
      params: { barber: JSON.stringify(barber), service: JSON.stringify(service) }
    });
  };

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.serviceCard}
      onPress={() => handleSelectService(item)}
    >
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.serviceDescription}>{item.description}</Text>
        <Text style={styles.serviceDuration}>Duration: {item.duration} min</Text>
      </View>
      
      <View style={styles.servicePriceContainer}>
        <Text style={styles.servicePrice}>${item.price.toFixed(2)}</Text>
        <Ionicons name="chevron-forward" size={24} color="#2196F3" />
      </View>
    </TouchableOpacity>
  );

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{item.customerName || 'Anonymous'}</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons 
              key={star}
              name={star <= item.rating ? "star" : "star-outline"} 
              size={16} 
              color="#FFD700" 
            />
          ))}
        </View>
        <Text style={styles.reviewDate}>
          {item.createdAt ? new Date(item.createdAt.seconds ? item.createdAt.toDate() : item.createdAt).toLocaleDateString() : 'N/A'}
        </Text>
      </View>
      <Text style={styles.reviewText}>{item.text}</Text>
    </View>
  );

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
      <View style={styles.barberHeader}>
        <View style={styles.barberImageContainer}>
          {barber.photoURL ? (
            <Image source={{ uri: barber.photoURL }} style={styles.barberImage} />
          ) : (
            <View style={styles.barberImagePlaceholder}>
              <Text style={styles.barberImagePlaceholderText}>
                {barber.name ? barber.name.charAt(0).toUpperCase() : 'B'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.barberInfo}>
          <Text style={styles.barberName}>{barber.name}</Text>
          <Text style={styles.barberAddress}>{barber.address}</Text>
          <Text style={styles.barberPhone}>{barber.phone}</Text>
          
          {barber.rating !== undefined && barber.rating !== null && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>{barber.rating.toFixed(1)}</Text>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.reviewCount}>
                ({barber.reviewCount || 0} reviews)
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'services' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('services')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'services' && styles.activeTabButtonText
          ]}>
            Services
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'reviews' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'reviews' && styles.activeTabButtonText
          ]}>
            Reviews
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading barber information...</Text>
        </View>
      ) : error && !loading ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchData(barber.id)} // Retry with barber.id
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
      ) : (
        reviews.length > 0 ? (
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
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  barberHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  barberImageContainer: {
    marginRight: 16,
  },
  barberImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  barberImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barberImagePlaceholderText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  barberInfo: {
    flex: 1,
  },
  barberName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  barberAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  barberPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
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
  noDataText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
  },
  servicePriceContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
  },
});

export default BarberServicesScreen;

