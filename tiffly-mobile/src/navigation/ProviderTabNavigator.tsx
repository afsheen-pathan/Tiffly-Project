// src/navigation/ProviderTabNavigator.tsx
import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { DashboardScreen } from "../screens/provider/DashboardScreen";
import { MenuScreen } from "../screens/provider/MenuScreen";
import { WeeklyMenuScreen } from "../screens/provider/WeeklyMenuScreen";
import { ProfileScreen } from "../screens/provider/ProfileScreen";
import { EarningsScreen } from "../screens/provider/EarningsScreen";
import { AccountSettingsScreen } from "../screens/shared/AccountSettingsScreen";
import { NotificationScreen } from "../screens/shared/NotificationScreen";
import { useTheme, Badge } from "react-native-paper";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";

// ✅ FIXED — Use Expo Vector Icons
import { MaterialCommunityIcons } from "@expo/vector-icons";

// ------------------ MENU STACK ------------------
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
        headerTintColor: "#fff",
      }}
    >
      <MenuStack.Screen
        name="PlanList"
        component={MenuScreen}
        options={{ title: "My Subscription Plans" }}
      />
      <MenuStack.Screen
        name="WeeklyMenu"
        component={WeeklyMenuScreen}
        options={{ title: "Set Weekly Menu" }}
      />
    </MenuStack.Navigator>
  );
};

// ------------------ PROFILE STACK ------------------
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
        headerTintColor: "#fff",
      }}
    >
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: "My Profile" }}
      />
      <ProfileStack.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: "My Earnings" }}
      />
      <ProfileStack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={{ title: "Account Settings" }}
      />
    </ProfileStack.Navigator>
  );
};

// ------------------ NOTIFICATION ICON ------------------
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

// ------------------ TAB PARAMS ------------------
export type ProviderTabParamList = {
  Dashboard: undefined;
  MenuStack: MenuStackParamList;
  Notifications: undefined;
  ProfileStack: ProfileStackParamList;
};

const Tab = createBottomTabNavigator<ProviderTabParamList>();

// ------------------ MAIN TABS ------------------
export const ProviderTabNavigator = () => {
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
          backgroundColor: "#fff",
        },
      }}
      initialRouteName="Dashboard"
    >
      {/* Dashboard */}
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Daily List",
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: "#fff",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Menu */}
      <Tab.Screen
        name="MenuStack"
        component={MenuStackNavigator}
        options={{
          tabBarLabel: "My Menu",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="silverware-variant"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* Notifications */}
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

      {/* Profile */}
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
      />
    </Tab.Navigator>
  );
};
