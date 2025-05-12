import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import theme from '@/styles/theme'; // Adjusted path
import { ScreenContainer, ScreenHeader } from '@/components/LayoutComponents'; // Adjusted path
import { Button, Card } from '@/components/UIComponents'; // Adjusted path

const BarberCommunicationScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('bulletin');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bulletin':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabDescription}>
              The Barber Bulletin Board allows you to share information, ask questions, and connect with other barbers in the community.
            </Text>
            <Button 
              title="Go to Bulletin Board" 
              icon="newspaper-outline" // Updated icon name
              onPress={() => router.push('/(app)/(barber)/bulletin')} 
              style={styles.navigationButton}
            />
          </View>
        );
      case 'network':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabDescription}>
              The Barber Network helps you find and connect with other barbers in your area for collaboration and community building.
            </Text>
            <Button 
              title="Find Barbers Near You" 
              icon="people-outline" // Updated icon name
              onPress={() => router.push('/(app)/(barber)/network')} 
              style={styles.navigationButton}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader 
        title="Barber Communication Hub" // Updated title
        leftComponent={
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      <View style={styles.container}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'bulletin' && styles.activeTab]}
            onPress={() => setActiveTab('bulletin')}
          >
            <Ionicons 
              name="newspaper-outline" // Updated icon name
              size={22} // Adjusted size
              color={activeTab === 'bulletin' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'bulletin' && styles.activeTabText]}>
              Bulletin Board
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'network' && styles.activeTab]}
            onPress={() => setActiveTab('network')}
          >
            <Ionicons 
              name="people-outline" // Updated icon name
              size={22} // Adjusted size
              color={activeTab === 'network' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'network' && styles.activeTabText]}>
              Barber Network
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.featuredCard}>
          <View style={styles.featuredCardHeader}>
            <Ionicons name="star-outline" size={24} color={theme.colors.warning} />
            <Text style={styles.featuredCardTitle}>Connect & Grow</Text>
          </View>
          
          <Text style={styles.featuredCardDescription}>
            Utilize these tools to engage with the barber community, share insights, and expand your professional network.
          </Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="chatbubbles-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Community Discussions</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Event Announcements</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="briefcase-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Job Opportunities</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="bulb-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Tips & Techniques</Text>
            </View>
          </View>
        </Card>

        {renderTabContent()}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.regular,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.large, // Increased margin
    borderRadius: theme.borderRadius.large, // Increased radius
    backgroundColor: theme.colors.backgroundLight,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.medium + 2, // Increased padding
    backgroundColor: theme.colors.backgroundLight,
  },
  activeTab: {
    backgroundColor: theme.colors.white, // Changed active tab background
    borderBottomWidth: 3, // Increased border width
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    marginLeft: theme.spacing.small,
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  featuredCard: {
    marginBottom: theme.spacing.large, // Increased margin
    padding: theme.spacing.medium, // Added padding
  },
  featuredCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.medium, // Increased margin
  },
  featuredCardTitle: {
    marginLeft: theme.spacing.small,
    fontSize: theme.typography.fontSize.large + 2, // Increased font size
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  featuredCardDescription: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.medium,
    lineHeight: theme.typography.lineHeight.medium, // Added line height
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.small, // Added margin
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: theme.spacing.medium, // Increased margin
  },
  featureText: {
    marginLeft: theme.spacing.small,
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textPrimary,
  },
  tabContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', // Changed to flex-start
    paddingVertical: theme.spacing.large, // Increased padding
    paddingHorizontal: theme.spacing.regular,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.medium,
    minHeight: 200, // Ensure content area has some height
  },
  tabDescription: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xlarge, // Increased margin
    lineHeight: theme.typography.lineHeight.medium, // Added line height
  },
  navigationButton: {
    width: '100%',
    maxWidth: 320, // Increased max width
    paddingVertical: theme.spacing.medium, // Added padding
  },
});

export default BarberCommunicationScreen;

