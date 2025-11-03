// src/navigation/AppNavigator.tsx

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useUserRole } from '../hooks/useUserRole';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { ProviderTabNavigator } from './ProviderTabNavigator';
import { OnboardingFormScreen } from '../screens/provider/OnboardingFormScreen';
import { PendingApprovalScreen } from '../screens/provider/PendingApprovalScreen';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native-paper';
import { PendingProviderTabNavigator } from './PendingProviderTabNavigator'; 

// This is the new App Stack, which will contain OTHER navigators
const AppStack = createStackNavigator();

// A simple loading screen
const LoadingScreen = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" />
  </View>
);

// This is the "brain" component that decides what to show
const AppSwitcher = () => {
  // 1. Get the new refetch function
  const { role, providerStatus, loading, refetch } = useUserRole();

  if (loading) {
    return <LoadingScreen />;
  }

  if (role === 'customer') {
    return <CustomerTabNavigator />;
  }

  if (role === 'provider') {
    if (providerStatus === 'approved') {
      return <ProviderTabNavigator />;
    } else if (providerStatus === 'pending_approval') {
      // 2. Show the new Pending Tab Navigator
      return <PendingProviderTabNavigator />; 
    } else if (providerStatus === 'pending') {
      // 3. Pass the refetch function as a prop to the form
      return <OnboardingFormScreen onProfileSubmit={refetch} />;
    }
  }

  return (
    <View style={styles.container}>
      <Text>Error: User role not found or status unknown.</Text>
    </View>
  );
};


// This is the main export now
export const AppNavigator = () => {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="AppSwitcher" component={AppSwitcher} />
    </AppStack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});