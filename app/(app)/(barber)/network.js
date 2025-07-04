import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, auth, getBarbersByZipcode } from '@/services/firebase'; // Adjusted path
import { useRouter, useFocusEffect } from 'expo-router';
import theme from '@/styles/theme'; // Adjusted path
import { ScreenContainer, ScreenHeader } from '@/components/LayoutComponents'; // Adjusted path
import { Button, Card, EmptyState } from '@/components/UIComponents'; // Adjusted path
import { startOrGetChatThread } from '@/services/chatService'; // Make sure this path is correct

const BarberNetworkScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [barbers, setBarbers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [zipcode, setZipcode] = useState('');
  const [searchZipcode, setSearchZipcode] = useState('');
  const [searching, setSearching] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/(auth)/login');
        setLoading(false);
        return;
      }
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      if (userProfile && userProfile.zipcode) {
        setZipcode(userProfile.zipcode);
        setSearchZipcode(userProfile.zipcode);
        await fetchBarbersByZip(userProfile.zipcode, user.uid);
      } else {
        // If no zipcode in profile, don't auto-search, let user input
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data. Please try again.');
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [fetchInitialData])
  );

  const fetchBarbersByZip = async (zip, currentUserId) => {
    try {
      // Keep setLoading(true) only if it's not a refresh action
      if (!refreshing) setLoading(true);
      setError('');
      const barbersData = await getBarbersByZipcode(zip);
      const filteredBarbers = barbersData.filter(barber => barber.id !== currentUserId);
      setBarbers(filteredBarbers);
    } catch (err) {
      console.error('Error fetching barbers:', err);
      setError(`Failed to load barbers for zipcode ${zip}.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSearching(false);
    }
  };

  const handleRefresh = () => {
    if (!searchZipcode) return;
    setRefreshing(true);
    const user = auth.currentUser;
    if (user) {
        fetchBarbersByZip(searchZipcode, user.uid);
    }
  };

  const handleSearch = () => {
    if (!zipcode.trim() || zipcode.length !== 5 || !/^[0-9]{5}$/.test(zipcode)) {
      Alert.alert('Invalid Zipcode', 'Please enter a valid 5-digit zipcode.');
      return;
    }
    setSearching(true);
    setSearchZipcode(zipcode);
    const user = auth.currentUser;
    if (user) {
        fetchBarbersByZip(zipcode, user.uid);
    }
  };

const handleMessageBarber = async (barber) => {
  console.log('Message button pressed for barber:', barber.name);
  try {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId || !barber.id) {
      Alert.alert('Missing Info', 'Unable to identify both users for chat.');
      return;
    }

    const threadId = await startOrGetChatThread(currentUserId, barber.id);
  router.push({
  pathname: '/(app)/(barber)/chat',
  params: { threadId }, // ✅ this is correct if chat.js expects threadId
});
  } catch (err) {
    console.error('Failed to initiate chat:', err);
    Alert.alert('Error', 'Could not start chat. Please try again later.');
  }
};

  const renderBarberItem = ({ item }) => (
    <Card style={styles.barberCard}>
      <View style={styles.barberInfo}>
        <Text style={styles.barberName}>{item.name || 'Barber Name Unavailable'}</Text>
        <Text style={styles.barberShop}>{item.shopName || 'Independent Barber'}</Text>
        
        <View style={styles.barberDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.zipcode}</Text>
          </View>
          
          {item.specialties && item.specialties.length > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="cut-outline" size={16} color={theme.colors.textSecondary} style={styles.detailIcon} />
              <Text style={styles.detailText} numberOfLines={1}>{item.specialties.join(', ')}</Text>
            </View>
          )}
          
          {item.yearsExperience !== undefined && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.yearsExperience} years experience</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.barberActions}>
        <Button 
          title="Message" 
          onPress={() => handleMessageBarber(item)} 
          style={styles.messageButton}
          textStyle={styles.messageButtonText}
          icon={<Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.colors.white} />}
          small
        />
        <Button 
          title="View Profile" 
          onPress={() => router.push({ pathname: '/(app)/(barber)/view-barber-profile', params: { barberId: item.id }})} 
          style={styles.viewProfileButton}
          textStyle={styles.viewProfileButtonText}
          type="outline"
          small
        />
      </View>
    </Card>
  );

  return (
    <ScreenContainer>
      <ScreenHeader title="Barber Network" />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={zipcode}
              onChangeText={setZipcode}
              placeholder="Enter 5-digit zipcode"
              placeholderTextColor={theme.colors.textPlaceholder}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
          <Button 
            title={searching ? '' : "Search"}
            onPress={handleSearch}
            disabled={searching}
            style={styles.searchButton}
            icon={searching ? <ActivityIndicator size="small" color={theme.colors.white} /> : null}
          />
        </View>

        {error && !loading ? <Text style={styles.errorText}>{error}</Text> : null}

        {searchZipcode && !error && !loading && (
          <Text style={styles.resultsText}>
            Showing barbers near {searchZipcode}
          </Text>
        )}

        {loading && !refreshing ? (
            <View style={styles.centeredStatus}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
        ) : (
          <FlatList
            data={barbers}
            renderItem={renderBarberItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              !loading && !error && (
                <EmptyState 
                    iconName="people-circle-outline"
                    title="No Barbers Found"
                    message={searchZipcode ? `No barbers found for zipcode ${searchZipcode}. Try a different one.` : "Enter a zipcode to find barbers near you."}
                />
              )
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centeredStatus: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: theme.spacing.regular,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.small,
    marginRight: theme.spacing.small,
    height: 44, // Standard height
  },
  searchIcon: {
    marginRight: theme.spacing.small,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textPrimary,
  },
  searchButton: {
    paddingHorizontal: theme.spacing.medium,
    height: 44, // Match input height
  },
  errorText: {
    color: theme.colors.danger,
    padding: theme.spacing.regular,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.medium,
  },
  resultsText: {
    paddingHorizontal: theme.spacing.regular,
    paddingTop: theme.spacing.regular,
    paddingBottom: theme.spacing.small,
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: theme.spacing.regular,
    paddingBottom: theme.spacing.large, // Ensure space at bottom
  },
  barberCard: {
    marginTop: theme.spacing.small, // Replaces marginBottom for consistent spacing
    marginBottom: theme.spacing.small,
  },
  barberInfo: {
    marginBottom: theme.spacing.medium,
  },
  barberName: {
    fontSize: theme.typography.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.tiny,
  },
  barberShop: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.small,
  },
  barberDetails: {
    marginTop: theme.spacing.small,
    paddingTop: theme.spacing.small,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.tiny,
  },
  detailIcon: {
    marginRight: theme.spacing.small,
  },
  detailText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textSecondary,
    flexShrink: 1, // Allow text to shrink if needed
  },
  barberActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.small,
  },
  messageButton: {
    flex: 1,
    marginRight: theme.spacing.small / 2,
  },
  messageButtonText: {
    // fontWeight: 'bold', // Already handled by Button component for primary
  },
  viewProfileButton: {
    flex: 1,
    marginLeft: theme.spacing.small / 2,
  },
  viewProfileButtonText: {
    // color: theme.colors.primary, // Already handled by Button component for outline
    // fontWeight: 'bold',
  },
});

export default BarberNetworkScreen;

