// src/screens/customer/ProfileScreen.tsx
import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native'; // Import Alert
import { Text, Button, List, Divider, Avatar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/CustomerTabNavigator'; // Import param list

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
        <Text style={styles.statusText}>(Customer)</Text>
      </View>

      {/* List items for navigation */}
      <List.Section>
        <List.Subheader>Account</List.Subheader>
        {/* Payment History Button */}
        <List.Item
          title="Payment History"
          description="View your past subscription payments"
          left={() => <List.Icon icon="history" />}
          right={() => <List.Icon icon="chevron-right" />}
          onPress={() => navigation.navigate('PaymentHistory')} // Navigates to PaymentHistory
          style={styles.listItem}
        />
        {/* My Details / Account Settings Button */}
        <List.Item
          title="My Details"
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

  /* HEADER */
  header: {
    backgroundColor: "#fff",
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  avatar: {
    marginBottom: 14,
    backgroundColor: "#e53935",
  },

  emailText: {
    fontWeight: "700",
    fontSize: 18,
    color: "#222",
  },

  statusText: {
    marginTop: 6,
    fontSize: 14,
    color: "#777",
  },

  /* LIST ITEMS */
  listItem: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
    paddingVertical: 4,
  },

  divider: {
    height: 18,
    backgroundColor: "transparent",
  },

  /* LOGOUT BUTTON */
  logoutButton: {
    margin: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#e53935",
    elevation: 2,
  },
});
