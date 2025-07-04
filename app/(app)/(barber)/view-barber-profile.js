import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getUserProfile } from '@/services/firebase';
import { ScreenContainer, ScreenHeader } from '@/components/LayoutComponents';
import theme from '@/styles/theme';

const ViewBarberProfile = () => {
  const { barberId } = useLocalSearchParams();
  const router = useRouter();
  const [barber, setBarber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBarber = async () => {
      try {
        const data = await getUserProfile(barberId);
        setBarber(data);
      } catch (err) {
        console.error('Error fetching barber profile:', err);
        setError('Failed to load barber profile.');
      } finally {
        setLoading(false);
      }
    };

    if (barberId) fetchBarber();
  }, [barberId]);

  if (loading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Barber Profile" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Barber Profile" />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!barber) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Barber Profile" />
        <View style={styles.center}>
          <Text style={styles.errorText}>Barber not found.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Barber Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>{barber.name}</Text>
        <Text style={styles.label}>Shop:</Text>
        <Text style={styles.text}>{barber.shopName || 'Independent Barber'}</Text>

        <Text style={styles.label}>Zipcode:</Text>
        <Text style={styles.text}>{barber.zipcode}</Text>

        {barber.specialties?.length > 0 && (
          <>
            <Text style={styles.label}>Specialties:</Text>
            <Text style={styles.text}>{barber.specialties.join(', ')}</Text>
          </>
        )}

        {barber.yearsExperience !== undefined && (
          <>
            <Text style={styles.label}>Experience:</Text>
            <Text style={styles.text}>{barber.yearsExperience} years</Text>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: theme.spacing.large,
  },
  name: {
    fontSize: theme.typography.fontSize.xlarge,
    fontWeight: 'bold',
    marginBottom: theme.spacing.medium,
  },
  label: {
    fontSize: theme.typography.fontSize.medium,
    fontWeight: 'bold',
    marginTop: theme.spacing.medium,
  },
  text: {
    fontSize: theme.typography.fontSize.medium,
    marginBottom: theme.spacing.small,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.fontSize.medium,
  },
});

export default ViewBarberProfile;
