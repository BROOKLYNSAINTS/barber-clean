import React from 'react';
import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import theme from "@/styles/theme"; // Adjusted path

export default function BarberTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Screens can manage their own headers
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
        name="dashboard" // This will be app/(app)/(barber)/dashboard.js
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: "Availability",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-number-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="manage-services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cut-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bulletin"
        options={{
          title: "Bulletin",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone-outline" size={size} color={color} />
          ),
        }}
      />
       <Tabs.Screen
        name="network"
        options={{
          title: "Network",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="communication" // Placeholder for a general communication/chat hub for barbers
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden screens in this tab group, accessed via router.push */}
      <Tabs.Screen name="bulletin-post-details" options={{ href: null, title: 'Post Details' }} />
      <Tabs.Screen name="subscription" options={{ href: null, title: 'Subscription' }} />
      <Tabs.Screen name="subscription-payment" options={{ href: null, title: 'Payment' }} />
      {/* Add other barber-specific stack screens here if they are not tabs */}
      {/* e.g., <Tabs.Screen name="barber-profile-view" options={{ href: null }} /> */}

    </Tabs>
  );
}

