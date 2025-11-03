// src/screens/shared/AccountSettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Card } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile, UserProfileDetails } from '../../services/userService';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigation } from '@react-navigation/native';

// Validation Schema (same as the modal)
const detailsSchema = z.object({
  name: z.string().min(3, 'Full name is required'),
  address: z.string().min(10, 'Full delivery address is required'),
  phoneNumber: z.string().min(10, 'Valid 10-digit phone number is required').max(15, 'Phone number too long'),
});

export const AccountSettingsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true); // For initial fetch
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<UserProfileDetails>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: '', address: '', phoneNumber: '' },
  });

  // 1. Fetch current user details on load
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          // Pre-fill the form with existing data
          setValue('name', data.name || '');
          setValue('address', data.address || '');
          setValue('phoneNumber', data.phoneNumber || '');
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        Alert.alert("Error", "Could not load your profile details.");
      }
      setLoading(false);
    };
    fetchUserDetails();
  }, [user, setValue]);

  // 2. Handle form submission
  const onSubmit = async (data: UserProfileDetails) => {
    if (!user) return;
    setIsSubmitting(true);
    
    const { success, error } = await updateUserProfile(user.uid, data);
    setIsSubmitting(false);

    if (success) {
      Alert.alert('Success', 'Your details have been updated!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', error || 'Failed to update details. Please try again.');
    }
  };

  if (loading) {
    return <ActivityIndicator animating={true} style={styles.loader} size="large" />;
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Your Details" subtitle="Update your name, address, and phone number" />
        <Card.Content>
          {/* Name Input */}
          <Controller name="name" control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Full Name" value={value} onBlur={onBlur}
                onChangeText={onChange} error={!!errors.name} style={styles.input} />
          )}/>
          {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

          {/* Address Input */}
          <Controller name="address" control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Full Delivery Address" value={value} onBlur={onBlur}
                onChangeText={onChange} error={!!errors.address} style={styles.input} multiline numberOfLines={3} />
          )}/>
          {errors.address && <Text style={styles.errorText}>{errors.address.message}</Text>}

          {/* Phone Number Input */}
          <Controller name="phoneNumber" control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Phone Number" value={value} onBlur={onBlur}
                onChangeText={onChange} error={!!errors.phoneNumber} style={styles.input} keyboardType="phone-pad" />
          )}/>
          {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.saveButton}
          >
            Save Changes
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 8,
    elevation: 2,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 8,
    marginTop: -8,
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 20,
    paddingVertical: 4,
  },
});