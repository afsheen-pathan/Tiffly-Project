// src/screens/provider/ProfileScreen.tsx
import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native'; // Import Alert
import { Text, Button, List, Divider, Avatar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/ProviderTabNavigator'; // Import param list

// Define the navigation prop type
type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>(); // Get navigation object

  return (
    <ScrollView style={styles.container}>
      {/* Header with Avatar and Email */}
      <View style={styles.header}>
        <Avatar.Icon size={80} icon="account-circle" style={styles.avatar} />
        <Text variant="headlineSmall" style={styles.emailText}>
          {user?.email}
        </Text>
        <Text style={styles.statusText}>(Approved Provider)</Text>
      </View>

      {/* List items for navigation */}
      <List.Section>
        <List.Subheader>Account</List.Subheader>
        {/* Earnings Button */}
        <List.Item
          title="My Earnings"
          description="View your transaction history"
          left={() => <List.Icon icon="cash-multiple" />}
          right={() => <List.Icon icon="chevron-right" />}
          onPress={() => navigation.navigate('Earnings')} // Navigates to Earnings
          style={styles.listItem}
        />
        {/* Account Settings Button */}
        <List.Item
          title="Account Settings"
          description="Update your name, address, or phone"
          left={() => <List.Icon icon="account-edit-outline" />}
          right={() => <List.Icon icon="chevron-right" />}
          onPress={() => navigation.navigate('AccountSettings')} // <-- UPDATED: Navigate to AccountSettings
          style={styles.listItem}
        />
      </List.Section>
      
      <Divider style={styles.divider} />

      {/* Logout Button */}
      <Button
        mode="contained"
        onPress={signOut}
        icon="logout"
        style={styles.logoutButton}
      >
        Logout
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  /* ---------- HEADER ---------- */
  header: {
    backgroundColor: "#ffffff",
    paddingVertical: 30,
    alignItems: "center",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 3,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },

  avatar: {
    backgroundColor: "#e53935",
    elevation: 4,
  },

  emailText: {
    marginTop: 12,
    fontSize: 18,
    color: "#222",
    fontWeight: "700",
  },

  statusText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
    color: "#777",
  },

  /* ---------- LIST SECTION ---------- */
  listItem: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 10,
    paddingVertical: 4,
    elevation: 1,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },

  divider: {
    height: 20,
    backgroundColor: "transparent",
  },

  /* ---------- LOGOUT BUTTON ---------- */
  logoutButton: {
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: "#e53935",
    borderRadius: 10,
    paddingVertical: 6,
    elevation: 2,
  },
});
