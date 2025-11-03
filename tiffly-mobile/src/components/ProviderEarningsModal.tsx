// src/components/ProviderEarningsModal.tsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, Divider } from 'react-native-paper';
import type { Subscription } from '../services/userService'; // Import the Subscription type
import { format } from 'date-fns';

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return `₹${amount.toFixed(2)}`;
};

// Helper component for displaying detail rows
const DetailRow = ({ label, value }: { label: string; value?: string | number | null }) => (
  <View style={styles.modalDetailRow}>
    <Text style={styles.modalDetailLabel}>{label}:</Text>
    <Text style={styles.modalDetailValue}>{value ?? '-'}</Text>
  </View>
);

interface Props {
  visible: boolean;
  onDismiss: () => void;
  subscription: Subscription | null;
}

export const ProviderEarningsModal = ({ visible, onDismiss, subscription }: Props) => {
  if (!subscription) return null;

  const startDate = subscription.startDate.toDate();
  const endDate = subscription.endDate.toDate();
  const price = subscription.pricePaid || 0;
  const earning = price * 0.90; // Calculate 90%

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <ScrollView>
          <Text variant="headlineSmall" style={styles.modalTitle}>{subscription.planName}</Text>
          {/* --- SHOW CUSTOMER NAME --- */}
          <Text style={styles.modalSubtitle}>Customer: {subscription.customerName || 'N/A'}</Text>
          <Divider style={styles.divider} />

          <DetailRow label="Status" value={subscription.status} />
          <DetailRow label="Total Amount Paid" value={formatCurrency(price)} />
          <DetailRow label="Your Earning (90%)" value={formatCurrency(earning)} />
          <DetailRow label="Plan Frequency" value={subscription.planFrequency} />
          <DetailRow label="Start Date" value={format(startDate, 'MMM d, yyyy')} />
          <DetailRow label="End/Renewal Date" value={format(endDate, 'MMM d, yyyy')} />
          {subscription.pausedUntil && (
             <DetailRow label="Paused Until" value={format(subscription.pausedUntil.toDate(), 'MMM d, yyyy')} />
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
  modalContainer: { backgroundColor: 'white', padding: 22, margin: 20, borderRadius: 8, maxHeight: '80%' },
  modalTitle: { marginBottom: 4, textAlign: 'center', fontWeight: 'bold' },
  modalSubtitle: { marginBottom: 16, textAlign: 'center', fontSize: 14, color: 'gray' },
  divider: { marginVertical: 12 },
  modalDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  modalDetailLabel: { fontSize: 15, color: '#555', fontWeight: '600' },
  modalDetailValue: { fontSize: 15, color: '#333', textAlign: 'right', flexShrink: 1, textTransform: 'capitalize' },
  modalButton: { marginTop: 20 },
});