// src/components/PlanDetailModal.tsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, Divider } from 'react-native-paper';
import type { Plan } from '../services/userService'; // Import the Plan type

// Prop types for the modal
interface Props {
  visible: boolean;
  onDismiss: () => void;
  plan: Plan | null; // Plan to display
}

// Helper component for displaying detail rows
const DetailRow = ({ label, value }: { label: string; value?: string | number | null }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value ?? '-'}</Text>
  </View>
);

export const PlanDetailModal = ({ visible, onDismiss, plan }: Props) => {
  if (!plan) return null; // Don't render if no plan selected

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <ScrollView>
          <Text variant="headlineMedium" style={styles.modalTitle}>Plan Details</Text>

          <DetailRow label="Plan Name" value={plan.planName} />
          <DetailRow label="Price" value={`₹${plan.price}`} />
          <DetailRow label="Meal Type" value={plan.mealType} />
          <DetailRow label="Frequency" value={plan.frequency} />
          {plan.description && (
            <>
              <Divider style={styles.divider} />
              <DetailRow label="Description" value={plan.description} />
            </>
          )}

          <Button onPress={onDismiss} style={styles.modalButton}>
            Close
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
    maxHeight: '80%', // Adjust height as needed
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  detailLabel: {
    fontSize: 15,
    color: '#555',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    flexShrink: 1, // Allow value text to wrap if long
    textAlign: 'right',
  },
  divider: {
      marginVertical: 10,
  },
  modalButton: {
    marginTop: 20,
  },
});