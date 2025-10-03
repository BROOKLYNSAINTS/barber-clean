import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';
import { View } from 'react-native';

import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { app } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';

// Get Firestore instance with error handling
let db;
try {
  db = getFirestore(app);
} catch (error) {
  console.error('❌ Error getting Firestore instance:', error);
}

export default function BarberTabLayout() {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);

  // Notification subscription
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('⚠️ No current user in barber layout, skipping notification setup');
      return;
    }

    try {
      // Check if db is available
      if (!db) {
        console.error('❌ Firestore not initialized in barber layout');
        return;
      }
      
      // Get notifications
      const q = query(
        collection(db, 'users', currentUser.uid, 'notifications')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          // Filter for unread notifications
          const unreadNotifications = snapshot.docs.filter(doc => {
            const data = doc.data();
            return data.read === false && data.status !== 'cancelled';
          });
          
          setUnreadCount(unreadNotifications.length);
          console.log('📊 Barber notification count:', unreadNotifications.length);
        } catch (snapshotError) {
          console.error('❌ Error processing notification snapshot:', snapshotError);
        }
      }, (error) => {
        console.error('❌ Notification subscription error:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up notification subscription:', error);
    }
  }, [currentUser?.uid]);

  // Appointments subscription
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('⚠️ No current user in barber layout, skipping appointments setup');
      return;
    }

    try {
      // Check if db is available
      if (!db) {
        console.error('❌ Firestore not initialized for appointments');
        return;
      }
      
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get upcoming appointments
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('barberId', '==', currentUser.uid),
        where('status', '==', 'confirmed'),
        where('date', '>=', today)
      );

      const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
        try {
          // Count today's appointments
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);
          
          const todayAppointments = snapshot.docs.filter(doc => {
            const data = doc.data();
            const appointmentDate = data.date?.toDate?.() || new Date(data.date);
            return appointmentDate >= today && appointmentDate <= todayEnd;
          });
          
          setAppointmentCount(todayAppointments.length);
          console.log('📅 Barber today\'s appointments:', todayAppointments.length);
        } catch (snapshotError) {
          console.error('❌ Error processing appointments snapshot:', snapshotError);
        }
      }, (error) => {
        console.error('❌ Appointments subscription error:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up appointments subscription:', error);
    }
  }, [currentUser?.uid]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
          },
          tabBarLabelStyle: {
            fontSize: theme.typography.fontSize.xsmall,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
            tabBarBadge: appointmentCount > 0 ? appointmentCount : undefined,
          }}
        />
        <Tabs.Screen
          name="availability"
          options={{
            title: 'Availability',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="manage-services"
          options={{
            title: 'Services',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cut-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bulletin"
          options={{
            title: 'Bulletin',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="megaphone-outline" size={size} color={color} />
            ),
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          }}
        />
        <Tabs.Screen
          name="network"
          options={{
            title: 'Network',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat-list"
          options={{
            title: 'Chat_List',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat-assistant"
          options={{
            title: 'Chat_Assistant',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="sparkles-outline" 
              size={size} color={color} />
            ),
          }}
        />
        {/* Hidden screens */}
        <Tabs.Screen name="bulletin-post-details" options={{ href: null }} />
        <Tabs.Screen name="chat" options={{ href: null }} />
        <Tabs.Screen name="direct-card-payment" options={{ href: null }} />
        <Tabs.Screen name="new-chat" options={{ href: null }} />
        <Tabs.Screen name="stripe-diagnostics" options={{ href: null }} />
        <Tabs.Screen name="subscription-connect-flow" options={{ href: null }} />
        <Tabs.Screen name="subscription-payment" options={{ href: null }} />
        <Tabs.Screen name="subscription" options={{ href: null }} />
        <Tabs.Screen name="view-barber-profile" options={{ href: null }} />
        <Tabs.Screen name="web-based-payment" options={{ href: null }} />
        <Tabs.Screen name="barber-reviews" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

