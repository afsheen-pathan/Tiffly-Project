// src/components/AddressBar.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import type { CustomerTabParamList, HomeStackParamList } from '../navigation/CustomerTabNavigator';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'ProviderList'>;

export const AddressBar = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const tabNavigator = navigation.getParent<BottomTabNavigationProp<CustomerTabParamList>>();

  const [displayName, setDisplayName] = useState<string>('Set Your Location');
  const [displayAddress, setDisplayAddress] = useState<string>('Tap here to add your details');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (!user) return;

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setDisplayName(data.name || 'Set Your Location');
            setDisplayAddress(data.address || 'Tap here to add your details');
          }
        } catch {
          setDisplayAddress('Could not load address');
        }
      };
      load();
    }, [user])
  );

  const handlePress = () => {
    tabNavigator?.navigate('ProfileStack', { screen: 'AccountSettings' });
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <MaterialIcons name="location-on" size={24} color={theme.colors.primary} />

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>
          Deliver to: {displayName}
        </Text>

        <Text style={styles.addressText} numberOfLines={1}>
          {displayAddress}
        </Text>
      </View>

      <MaterialIcons name="keyboard-arrow-down" size={22} color="#888" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 3,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  addressText: {
    fontSize: 13,
    color: '#555',
  },
});
