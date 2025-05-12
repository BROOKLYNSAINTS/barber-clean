import React from 'react';
import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import theme from "@/styles/theme"; // Adjusted path

export default function CustomerTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Individual screens can set their own headers if needed
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
        name="index" // This will be app/(app)/(customer)/index.js
        options={{
          title: "Book",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appointments",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "AI Assistant",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden screens in this tab group, accessed via router.push but not shown in tabs */}
      <Tabs.Screen name="select-barber" options={{ href: null, title: 'Select Barber' }} />
      <Tabs.Screen name="barber-services" options={{ href: null, title: 'Barber Services' }} />
      <Tabs.Screen name="book-appointment" options={{ href: null, title: 'Book Appointment' }} />
      <Tabs.Screen name="appointment-confirmation" options={{ href: null, title: 'Confirmation' }} />
      <Tabs.Screen name="appointment-details" options={{ href: null, title: 'Appointment Details' }} />
      <Tabs.Screen name="edit-profile" options={{ href: null, title: 'Edit Profile' }} />
      <Tabs.Screen name="hairstyle-recommendation" options={{ href: null, title: 'Hairstyle Ideas' }} />
      <Tabs.Screen name="ai-booking-assistant" options={{ href: null, title: 'AI Booking' }} />
       <Tabs.Screen name="tip" options={{ href: null, title: 'Tip Barber' }} />
       <Tabs.Screen name="notification-settings" options={{ href: null, title: 'Notifications' }} />

    </Tabs>
  );
}

