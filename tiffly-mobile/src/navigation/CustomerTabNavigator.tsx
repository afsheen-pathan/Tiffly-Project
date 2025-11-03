// src/navigation/CustomerTabNavigator.tsx
import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/customer/HomeScreen';
import { SubscriptionScreen } from '../screens/customer/SubscriptionScreen';
import { ProfileScreen } from '../screens/customer/ProfileScreen';
import { ProviderDetailScreen } from '../screens/customer/ProviderDetailScreen';
import { PaymentHistoryScreen } from '../screens/customer/PaymentHistoryScreen';
import { AccountSettingsScreen } from '../screens/shared/AccountSettingsScreen';
import { NotificationScreen } from '../screens/shared/NotificationScreen';
import { useTheme, Badge } from 'react-native-paper'; // 1. Import Badge
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications'; // 2. Import the hook

// --- Home Stack (Existing) ---
export type HomeStackParamList = {
  ProviderList: undefined;
  ProviderDetail: { providerId: string; kitchenName: string };
};
const HomeStack = createStackNavigator<HomeStackParamList>();
const HomeStackNavigator = () => {
  const theme = useTheme();
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.onPrimary,
      }}
    >
      <HomeStack.Screen name="ProviderList" component={HomeScreen} options={{ title: 'Browse Providers' }} />
      <HomeStack.Screen name="ProviderDetail" component={ProviderDetailScreen} options={({ route }) => ({ title: route.params.kitchenName })} />
    </HomeStack.Navigator>
  );
};

// --- Profile Stack (Existing) ---
export type ProfileStackParamList = {
  ProfileHome: undefined;
  PaymentHistory: undefined;
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
      <ProfileStack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ title: 'Payment History' }} />
      <ProfileStack.Screen name="AccountSettings" component={AccountSettingsScreen} options={{ title: 'Account Settings' }} />
    </ProfileStack.Navigator>
  );
};

// --- Main Customer Tab Param List (Existing) ---
export type CustomerTabParamList = {
  HomeStack: HomeStackParamList;
  Subscription: undefined;
  Notifications: undefined;
  ProfileStack: ProfileStackParamList;
};

const Tab = createBottomTabNavigator<CustomerTabParamList>();

// --- 3. Create a wrapper component for the tab bar ---
// This is necessary because we can't call a hook directly inside 'options'
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

export const CustomerTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        headerShown: false,
      }}
      initialRouteName="HomeStack" 
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Browse',
          tabBarIcon: ({ color, size }) => (<Icon name="storefront-outline" color={color} size={size} />),
        }}
      />
      <Tab.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          title: 'My Subscription',
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          tabBarIcon: ({ color, size }) => (<Icon name="calendar-clock-outline" color={color} size={size} />),
        }}
      />
      {/* --- 4. ADD Notifications Tab with Badge --- */}
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
          tabBarIcon: ({ color, size }) => (<Icon name="account-circle-outline" color={color} size={size} />),
        }}
      />
    </Tab.Navigator>
  );
};