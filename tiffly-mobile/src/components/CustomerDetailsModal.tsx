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

// --- PREMIUM STYLES ---
const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: "92%",

    // Soft premium shadow
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#1A1A1A",
    marginBottom: 6,
  },

  modalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },

  // Premium input fields
  input: {
    marginBottom: 10,
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    paddingHorizontal: 4,

    // Border like food apps
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  modalButton: {
    marginTop: 14,
    borderRadius: 10,
    paddingVertical: 6,
  },

  errorTextModal: {
    color: "#E53935",
    marginLeft: 4,
    marginBottom: 8,
    fontSize: 12,
  },
});
