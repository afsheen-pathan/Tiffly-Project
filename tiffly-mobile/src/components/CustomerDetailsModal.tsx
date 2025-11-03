// src/components/CustomerDetailsModal.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserProfileDetails } from '../services/userService'; // Import the type

// Validation Schema
const detailsSchema = z.object({
  name: z.string().min(3, 'Full name is required (min 3 chars)'),
  address: z.string().min(10, 'Full delivery address is required (min 10 chars)'),
  phoneNumber: z.string().min(10, 'Valid 10-digit phone number is required').max(15, 'Phone number too long'), // Basic phone validation
});

// Prop types for the modal
interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (details: UserProfileDetails) => Promise<{ success: boolean; error?: string }>; // Function to save data
}

export const CustomerDetailsModal = ({ visible, onDismiss, onSubmit }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<UserProfileDetails>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: '',
      address: '',
      phoneNumber: '',
    },
  });

  // Handle form submission
  const handleFormSubmit = async (data: UserProfileDetails) => {
    setIsSubmitting(true);
    setSubmitError(null);
    const result = await onSubmit(data); // Call the onSubmit prop function
    setIsSubmitting(false);

    if (result.success) {
      reset(); // Clear form
      onDismiss(); // Close modal on success
    } else {
      setSubmitError(result.error || 'Failed to save details. Please try again.');
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
          <Text variant="headlineMedium" style={styles.modalTitle}>Delivery Details</Text>
          <Text style={styles.modalSubtitle}>Please provide your name and delivery address.</Text>

          {/* Name Input */}
          <Controller name="name" control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Full Name" value={value} onBlur={onBlur}
                onChangeText={onChange} error={!!errors.name} style={styles.input} />
          )}/>
          {errors.name && <Text style={styles.errorTextModal}>{errors.name.message}</Text>}

          {/* Address Input */}
          <Controller name="address" control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Full Delivery Address" value={value} onBlur={onBlur}
                onChangeText={onChange} error={!!errors.address} style={styles.input} multiline numberOfLines={3} />
          )}/>
          {errors.address && <Text style={styles.errorTextModal}>{errors.address.message}</Text>}

          {/* Phone Number Input */}
          <Controller name="phoneNumber" control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Phone Number" value={value} onBlur={onBlur}
                onChangeText={onChange} error={!!errors.phoneNumber} style={styles.input} keyboardType="phone-pad" />
          )}/>
          {errors.phoneNumber && <Text style={styles.errorTextModal}>{errors.phoneNumber.message}</Text>}

          {/* Submit Error */}
          {submitError && <Text style={[styles.errorTextModal, { textAlign: 'center', marginTop: 10 }]}>{submitError}</Text>}

          {/* Buttons */}
          <Button
            mode="contained"
            onPress={handleSubmit(handleFormSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.modalButton}
          >
            Save & Continue
          </Button>
          <Button onPress={handleClose} style={styles.modalButton} disabled={isSubmitting}>
            Cancel
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

// --- STYLES --- (Similar to Add Plan Modal)
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
    color: 'gray',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#f6f6f6',
  },
  modalButton: {
    marginTop: 10,
  },
  errorTextModal: {
    color: 'red',
    marginLeft: 8,
    marginBottom: 8,
    fontSize: 12,
  },
});