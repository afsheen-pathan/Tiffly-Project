// src/navigation/PendingProviderTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PendingApprovalScreen } from '../screens/provider/PendingApprovalScreen';
import { BlockedScreen } from '../screens/provider/BlockedScreen';
import { ProfileScreen } from '../screens/provider/ProfileScreen';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();

export const PendingProviderTabNavigator = () => {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.onPrimary,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={PendingApprovalScreen}
        options={{
          title: 'Application Status',
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Menu"
        component={BlockedScreen}
        options={{
          title: 'My Menu',
          tabBarIcon: ({ color, size }) => (
            <Icon name="silverware-variant" color={color} size={size} />
          ),
          tabBarBadge: 'Locked', // Adds a "Locked" badge
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};