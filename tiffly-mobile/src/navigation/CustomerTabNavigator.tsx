// src/navigation/CustomerTabNavigator.tsx
import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { HomeScreen } from "../screens/customer/HomeScreen";
import { SubscriptionScreen } from "../screens/customer/SubscriptionScreen";
import { ProfileScreen } from "../screens/customer/ProfileScreen";
import { ProviderDetailScreen } from "../screens/customer/ProviderDetailScreen";
import { PaymentHistoryScreen } from "../screens/customer/PaymentHistoryScreen";
import { AccountSettingsScreen } from "../screens/shared/AccountSettingsScreen";
import { NotificationScreen } from "../screens/shared/NotificationScreen";
import { useTheme, Badge } from "react-native-paper";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import { NavigatorScreenParams } from "@react-navigation/native";

// ✅ FIXED ICON PACKAGE (Expo compatible)
import { MaterialCommunityIcons } from "@expo/vector-icons";

// --------------------- HOME STACK ---------------------
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
        headerTintColor: "#fff",
      }}
    >
      <HomeStack.Screen
        name="ProviderList"
        component={HomeScreen}
        options={{ title: "Browse Providers" }}
      />
      <HomeStack.Screen
        name="ProviderDetail"
        component={ProviderDetailScreen}
        options={({ route }) => ({
          title: route.params.kitchenName,
        })}
      />
    </HomeStack.Navigator>
  );
};

// --------------------- PROFILE STACK ---------------------
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
        headerTintColor: "#fff",
      }}
    >
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: "My Profile" }}
      />
      <ProfileStack.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{ title: "Payment History" }}
      />
      <ProfileStack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={{ title: "Account Settings" }}
      />
    </ProfileStack.Navigator>
  );
};

// --------------------- TABS ---------------------
export type CustomerTabParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList>;
  Subscription: undefined;
  Notifications: undefined;
  ProfileStack: NavigatorScreenParams<ProfileStackParamList>;
};

const Tab = createBottomTabNavigator<CustomerTabParamList>();

// --------------------- Notifications Icon ---------------------
const NotificationsTabIcon = ({
  color,
  size,
}: {
  color: string;
  size: number;
}) => {
  const unreadCount = useUnreadNotifications();

  return (
    <View style={{ width: 24, height: 24, margin: 5 }}>
      <MaterialCommunityIcons name="bell-outline" color={color} size={size} />
      {unreadCount > 0 && (
        <Badge style={{ position: "absolute", top: -5, right: -10 }}>
          {unreadCount}
        </Badge>
      )}
    </View>
  );
};

// --------------------- MAIN TAB NAV ---------------------
export const CustomerTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        headerShown: false,
        tabBarStyle: {
          height: 58,
          paddingBottom: 6,
          paddingTop: 6,
          backgroundColor: "#ffffff",
        },
      }}
      initialRouteName="HomeStack"
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: "Browse",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="storefront-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          title: "My Subscription",
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: "#fff",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="calendar-clock-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          title: "Notifications",
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: "#fff",
          tabBarIcon: NotificationsTabIcon,
        }}
      />

      <Tab.Screen
        name="ProfileStack"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-circle-outline"
              color={color}
              size={size}
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("ProfileStack", { screen: "ProfileHome" });
          },
        })}
      />
    </Tab.Navigator>
  );
};
