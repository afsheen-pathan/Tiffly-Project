// src/navigation/ProviderTabNavigator.tsx
import React from 'react';
import { View } from 'react-native'; // 1. Import View
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { DashboardScreen } from '../screens/provider/DashboardScreen';
import { MenuScreen } from '../screens/provider/MenuScreen';
import { WeeklyMenuScreen } from '../screens/provider/WeeklyMenuScreen';
import { ProfileScreen } from '../screens/provider/ProfileScreen';
import { EarningsScreen } from '../screens/provider/EarningsScreen';
import { AccountSettingsScreen } from '../screens/shared/AccountSettingsScreen';
import { NotificationScreen } from '../screens/shared/NotificationScreen';
import { useTheme, Badge } from 'react-native-paper'; // 2. Import Badge
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications'; // 3. Import the hook

// --- Menu Stack (Existing) ---
export type MenuStackParamList = {
  PlanList: undefined;
  WeeklyMenu: undefined;
};
const MenuStack = createStackNavigator<MenuStackParamList>();
const MenuStackNavigator = () => {
  const theme = useTheme();
  return (
    <MenuStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.onPrimary,
      }}
    >
      <MenuStack.Screen name="PlanList" component={MenuScreen} options={{ title: 'My Subscription Plans' }} />
      <MenuStack.Screen name="WeeklyMenu" component={WeeklyMenuScreen} options={{ title: 'Set Weekly Menu' }} />
    </MenuStack.Navigator>
  );
};
// ------------------------------

// --- Profile Stack (Existing) ---
export type ProfileStackParamList = {
  ProfileHome: undefined;
  Earnings: undefined;
  AccountSettings: undefined;
};
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const ProfileStackNavigator = () => {
  const theme = useTheme();
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.onPrimary,
      }}
    >
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <ProfileStack.Screen name="Earnings" component={EarningsScreen} options={{ title: 'My Earnings' }} />
      <ProfileStack.Screen name="AccountSettings" component={AccountSettingsScreen} options={{ title: 'Account Settings' }} />
    </ProfileStack.Navigator>
  );
};
// ---------------------------------------------

// --- 4. Wrapper component for the tab bar icon ---
const NotificationsTabIcon = ({ color, size }: { color: string; size: number }) => {
  const unreadCount = useUnreadNotifications(); // Call the hook
  return (
    <View style={{ width: 24, height: 24, margin: 5 }}>
      <Icon name="bell-outline" color={color} size={size} />
      {unreadCount > 0 && (
        <Badge style={{ position: 'absolute', top: -5, right: -10 }}>
          {unreadCount}
        </Badge>
      )}
    </View>
  );
};
// ----------------------------------------------------

// --- 5. Define Main Provider Tab Param List (ADD Notifications) ---
export type ProviderTabParamList = {
  Dashboard: undefined;
  MenuStack: MenuStackParamList;
  Notifications: undefined; // <-- ADD THIS
  ProfileStack: ProfileStackParamList;
};
// --------------------------------------------

const Tab = createBottomTabNavigator<ProviderTabParamList>();

export const ProviderTabNavigator = () => {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        headerShown: false,
      }}
      initialRouteName="Dashboard"
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Daily List',
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MenuStack"
        component={MenuStackNavigator}
        options={{
          tabBarLabel: 'My Menu',
          tabBarIcon: ({ color, size }) => (
            <Icon name="silverware-variant" color={color} size={size} />
          ),
        }}
      />
       {/* --- 6. ADD Notifications Tab with Badge --- */}
       <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          title: 'Notifications',
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          tabBarIcon: NotificationsTabIcon, // Use the wrapper component
        }}
      />
      {/* -------------------------------------- */}
      <Tab.Screen
        name="ProfileStack"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};