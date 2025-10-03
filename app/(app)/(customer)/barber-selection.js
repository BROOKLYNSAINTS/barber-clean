import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getBarbersByZipcode } from '@/services/firebase';
import DebugUser from '@/components/DebugUser';


export default function SelectBarberScreen() {
/*return (
    <View style={{ padding: 20 }}>
      <DebugUser screenName="barber Selection" />
      <Text>📋 Welcome to the Barber Selection screen!</Text>
    </View>
  );*/


  const router = useRouter();
  const { zipcode } = useLocalSearchParams();

  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (zipcode) {
      fetchBarbers(zipcode);
    }
  }, [zipcode]);

  const fetchBarbers = async (zip) => {
    try {
      setLoading(true);
      const results = await getBarbersByZipcode(zip);
      setBarbers(results);
    } catch (err) {
      console.error('Failed to load barbers:', err);
      setError('Could not load barbers');
    } finally {
      setLoading(false);
    }
  };

  const handleBarberSelect = (barber) => {
    console.log('Selected Barber:', barber);
    
    // Make sure barber object has an ID
    if (!barber || !barber.id) {
      console.error('Invalid barber data:', barber);
      return;
    }
    
    // Navigate to the barber's services page with individual parameters
    router.push({
      pathname: '/(app)/(customer)/barber-services',
      params: { 
        barberId: barber.id,
        barberName: barber.name,
        barber: JSON.stringify(barber) // Keep this for backward compatibility
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>Loading barbers...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        data={barbers}
        keyExtractor={(item, idx) => String(item?.id ?? idx)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleBarberSelect(item)}>
            <Image
              source={{ uri: item.image || 'https://via.placeholder.com/60' }}
              style={styles.avatar}
              defaultSource={require('assets/icon-512.png')}
            />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.rating}>⭐ {item.rating || 0}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <Text style={styles.title}>Choose a Barber</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No barbers found in this area</Text>}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  info: {
    marginLeft: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  rating: {
    marginTop: 4,
    color: '#555',
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});


