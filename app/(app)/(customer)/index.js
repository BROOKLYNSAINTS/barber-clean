import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBarbersByZipcode } from '@/services/firebase'; // Adjusted path
import { useRouter } from 'expo-router';

const BarberSelectionScreen = () => {
  const router = useRouter();
  const [zipcode, setZipcode] = useState('');
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!zipcode || zipcode.length < 5) {
      setError('Please enter a valid zipcode');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSearched(true);
      
      const barbersData = await getBarbersByZipcode(zipcode);
      setBarbers(barbersData);
      
      if (barbersData.length === 0) {
        setError('No barbers found in this area');
      }
    } catch (error) {
      console.error('Error searching barbers:', error);
      setError('Failed to search barbers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBarber = (barber) => {
    // Pass barber data as a JSON string or individual params
    router.push({ 
      pathname: '/(app)/(customer)/barber-services', 
      params: { barber: JSON.stringify(barber) } 
    });
  };

  const renderBarberItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.barberCard}
      onPress={() => handleSelectBarber(item)}
    >
      <View style={styles.barberInfo}>
        <Text style={styles.barberName}>{item.name}</Text>
        <Text style={styles.barberAddress}>{item.address}</Text>
        <Text style={styles.barberPhone}>{item.phone}</Text>
        
        {item.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.reviewCount}>
              ({item.reviewCount || 0} reviews)
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={24} color="#2196F3" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.label}>Enter Zipcode</Text>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter zipcode to find barbers"
            value={zipcode}
            onChangeText={setZipcode}
            keyboardType="numeric"
            maxLength={5}
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading}
          >
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Searching for barbers...</Text>
        </View>
      ) : searched && barbers.length > 0 ? (
        <FlatList
          data={barbers}
          renderItem={renderBarberItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : searched ? (
        <View style={styles.centered}>
          <Ionicons name="search" size={64} color="#ccc" />
          <Text style={styles.noResultsText}>No barbers found in this area</Text>
          <Text style={styles.noResultsSubtext}>Try a different zipcode</Text>
        </View>
      ) : (
        <View style={styles.centered}>
          <Ionicons name="cut-outline" size={64} color="#ccc" />
          <Text style={styles.initialText}>Enter a zipcode to find barbers in your area</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  label: {
    marginBottom: 5,
    fontWeight: '500',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
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
  initialText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  noResultsText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  noResultsSubtext: {
    marginTop: 5,
    fontSize: 16,
    color: '#999',
  },
  listContainer: {
    padding: 16,
  },
  barberCard: {
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
  barberInfo: {
    flex: 1,
  },
  barberName: {
    fontSize: 18,
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
  arrowContainer: {
    justifyContent: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
});

export default BarberSelectionScreen;

