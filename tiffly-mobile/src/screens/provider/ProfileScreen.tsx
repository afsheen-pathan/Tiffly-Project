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

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    marginBottom: 12,
  },
  emailText: {
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 14,
    color: 'gray',
    marginTop: 4,
  },
  listItem: {
    backgroundColor: '#fff', // White background for list items
    borderBottomWidth: 1,     // Separator
    borderBottomColor: '#f0f0f0',
  },
  divider: {
    height: 12, // Use divider as a spacer
    backgroundColor: 'transparent',
  },
  logoutButton: {
    margin: 20,
    paddingVertical: 4,
    backgroundColor: '#B00020', // Red color for logout
  }
});