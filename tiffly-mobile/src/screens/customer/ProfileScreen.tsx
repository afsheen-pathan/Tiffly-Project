// src/screens/customer/ProfileScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Button, List, Divider, Avatar, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/CustomerTabNavigator';
import { doc, getDoc } from 'firebase/firestore'; // 1. Import Firestore functions
import { db } from '../../config/firebase';

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const theme = useTheme();

  // 2. Add state for name
  const [customerName, setCustomerName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // 3. Fetch user details
  useFocusEffect(
    useCallback(() => {
      const fetchUserProfile = async () => {
        if (!user) return;
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setCustomerName(data.name || 'Valued Customer');
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserProfile();
    }, [user])
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar.Icon 
          size={80} 
          icon="account-circle" 
          style={[styles.avatar, { backgroundColor: theme.colors.primary }]} 
        />
        
        {/* 4. Display Customer Name */}
        <Text variant="headlineSmall" style={styles.nameText}>
          {customerName}
        </Text>

        <Text variant="bodyMedium" style={styles.emailText}>
          {user?.email}
        </Text>
        
        <Text style={styles.statusText}>(Customer)</Text>
      </View>

      {/* List items */}
      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title="Payment History"
          description="View your past subscription payments"
          left={() => <List.Icon icon="history" />}
          right={() => <List.Icon icon="chevron-right" />}
          onPress={() => navigation.navigate('PaymentHistory')}
          style={styles.listItem}
        />
        <List.Item
          title="My Details"
          description="Update your name, address, or phone"
          left={() => <List.Icon icon="account-edit-outline" />}
          right={() => <List.Icon icon="chevron-right" />}
          onPress={() => navigation.navigate('AccountSettings')}
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
        buttonColor={theme.colors.error}
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
    elevation: 3,
  },
  avatar: {
    marginBottom: 14,
  },
  nameText: {
    fontWeight: "bold",
    fontSize: 22,
    color: "#222",
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: "#666",
  },
  statusText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "green",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
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
  logoutButton: {
    margin: 20,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
});