// src/navigation/AppNavigator.tsx
import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useUserRole } from "../hooks/useUserRole";
import {
  CustomerTabNavigator,
  CustomerTabParamList,
} from "./CustomerTabNavigator";
import {
  ProviderTabNavigator,
  ProviderTabParamList,
} from "./ProviderTabNavigator";
import { PendingProviderTabNavigator } from "./PendingProviderTabNavigator";
import { OnboardingFormScreen } from "../screens/provider/OnboardingFormScreen";
import { createStackNavigator } from "@react-navigation/stack";
import { Text } from "react-native-paper";
import { NavigatorScreenParams } from "@react-navigation/native";

export type AppStackParamList = {
  AppSwitcher: undefined;

  // Main app flows
  CustomerTab: NavigatorScreenParams<CustomerTabParamList>;
  ProviderTab: NavigatorScreenParams<ProviderTabParamList>;
  PendingProviderTab: undefined;

  // Onboarding
  OnboardingForm: undefined;
};

const Stack = createStackNavigator<AppStackParamList>();

// Simple loading indicator
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" />
  </View>
);

const AppSwitcher = () => {
  const { role, providerStatus, loading, refetch } = useUserRole();

  if (loading) return <LoadingScreen />;

  // -------- CUSTOMER --------
  if (role === "customer") {
    return <CustomerTabNavigator />;
  }

  // -------- PROVIDER --------
  if (role === "provider") {
    if (providerStatus === "approved") {
      return <ProviderTabNavigator />;
    }

    if (
      providerStatus === "pending_approval" ||
      providerStatus === "suspended" ||
      providerStatus === "rejected"
    ) {
      return <PendingProviderTabNavigator />;
    }

    if (providerStatus === "pending") {
      return <OnboardingFormScreen onProfileSubmit={refetch} />;
    }
  }

  // -------- FALLBACK --------
  return (
    <View style={styles.loadingContainer}>
      <Text>Error: User role unknown or missing.</Text>
    </View>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppSwitcher" component={AppSwitcher} />
    </Stack.Navigator>
  );
};

// --------------Styling--------------------------
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
