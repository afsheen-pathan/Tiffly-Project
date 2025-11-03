// src/components/ReportFoodModal.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createFoodReport } from '../services/userService';

// Validation Schema
const reportSchema = z.object({
  foodDescription: z.string().min(5, 'Please describe the food (min 5 chars)'),
  quantity: z.string().min(3, 'Please estimate the quantity (e.g., "Feeds 5-7")'),
  pickupByTime: z.string().min(3, 'Please enter a pickup time (e.g., "10 PM")'),
});

// Form data type
type ReportFormData = z.infer<typeof reportSchema>;

// Prop types for the modal
interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export const ReportFoodModal = ({ visible, onDismiss }: Props) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      foodDescription: '',
      quantity: '',
      pickupByTime: '',
    },
  });

  // Handle form submission
  const handleFormSubmit = async (data: ReportFormData) => {
    if (!user) {
      Alert.alert("Error", "You must be logged in.");
      return;
    }
    setIsSubmitting(true);

    try {
      // 1. Fetch the provider's profile to get their details
      const providerDocRef = doc(db, 'providerProfiles', user.uid);
      const docSnap = await getDoc(providerDocRef);

      if (!docSnap.exists()) {
        throw new Error("Provider profile not found.");
      }

      const profile = docSnap.data();
      
      // 2. Prepare the full report object
      const reportData = {
        providerId: user.uid,
        kitchenName: profile.kitchenName || 'N/A',
        providerAddress: `${profile.streetAddress || ''}, ${profile.city || ''}`,
        providerPhone: profile.phoneNumber || 'N/A',
        foodDescription: data.foodDescription,
        quantity: data.quantity,
        pickupByTime: data.pickupByTime,
      };

      // 3. Call the service function to save the report
      const result = await createFoodReport(reportData);

      if (result.success) {
        Alert.alert('Report Submitted', 'Thank you! An admin will review your report shortly.');
        reset();
        onDismiss();
      } else {
        throw new Error(result.error || 'Failed to submit report.');
      }

    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close handler also resets form
  const handleClose = () => {
    reset();
    onDismiss();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleClose} contentContainerStyle={styles.modalContainer}>
        <ScrollView>
          <Text variant="headlineMedium" style={styles.modalTitle}>Report Leftover Food</Text>
          <Text style={styles.modalSubtitle}>Fill in the details below. An admin will review your report and coordinate with an NGO if possible.</Text>

          {/* Food Description Input */}
          <Controller name="foodDescription" control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Food Description (e.g., Dal, Rice, 10 Roti)" value={value} onBlur={onBlur}
                onChangeText={onChange} error={!!errors.foodDescription} style={styles.input} multiline numberOfLines={3} />
          )}/>
          {errors.foodDescription && <Text style={styles.errorTextModal}>{errors.foodDescription.message}</Text>}

          {/* Quantity Input */}
          <Controller name="quantity" control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Estimated Quantity (e.g., Feeds 5-7)" value={value} onBlur={onBlur}
                onChangeText={onChange} error={!!errors.quantity} style={styles.input} />
          )}/>
          {errors.quantity && <Text style={styles.errorTextModal}>{errors.quantity.message}</Text>}

          {/* Pickup Time Input */}
          <Controller name="pickupByTime" control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Pickup-by Time (e.g., 10:00 PM)" value={value} onBlur={onBlur}
                onChangeText={onChange} error={!!errors.pickupByTime} style={styles.input} />
          )}/>
          {errors.pickupByTime && <Text style={styles.errorTextModal}>{errors.pickupByTime.message}</Text>}

          {/* Buttons */}
          <Button
            mode="contained"
            onPress={handleSubmit(handleFormSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.modalButton}
            icon="send"
          >
            Submit Report
          </Button>
          <Button onPress={handleClose} style={styles.modalButton} disabled={isSubmitting}>
            Cancel
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
   modalSubtitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 14,
    color: 'gray',
    lineHeight: 20,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#f6f6f6',
  },
  modalButton: {
    marginTop: 10,
    paddingVertical: 2,
  },
  errorTextModal: {
    color: 'red',
    marginLeft: 8,
    marginBottom: 8,
    fontSize: 12,
  },
});