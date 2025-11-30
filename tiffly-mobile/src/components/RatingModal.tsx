// src/components/RatingModal.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, IconButton, useTheme, HelperText } from 'react-native-paper';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (rating: number, review: string) => Promise<void>;
  providerName: string;
}

export const RatingModal = ({ visible, onDismiss, onSubmit, providerName }: Props) => {
  const theme = useTheme();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (review.trim().length < 5) {
        setError('Please write a short review (min 5 characters).');
        return;
    }
    
    setError('');
    setIsSubmitting(true);
    await onSubmit(rating, review);
    setIsSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    setRating(0);
    setReview('');
    setError('');
    onDismiss();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleClose} contentContainerStyle={styles.modalContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={styles.title}>Rate {providerName}</Text>
          <Text style={styles.subtitle}>How was your food?</Text>

          {/* Star Rating Row */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <IconButton
                key={star}
                icon={star <= rating ? "star" : "star-outline"}
                iconColor={theme.colors.primary} // Use orange theme color
                size={32}
                onPress={() => setRating(star)}
                style={styles.starButton}
              />
            ))}
          </View>
          
          {/* Review Input */}
          <TextInput
            label="Write a review"
            value={review}
            onChangeText={setReview}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            placeholder="Tell us what you liked..."
          />

          {/* Error Message */}
          {error ? <HelperText type="error" visible={true}>{error}</HelperText> : null}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Button onPress={handleClose} disabled={isSubmitting} style={styles.button}>
              Cancel
            </Button>
            <Button 
                mode="contained" 
                onPress={handleSubmit} 
                loading={isSubmitting} 
                disabled={isSubmitting}
                style={styles.button}
            >
              Submit
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  scrollContent: {
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: 'gray',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButton: {
    margin: 0,
  },
  input: {
    width: '100%',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 8,
    gap: 10,
  },
  button: {
    flex: 1,
  }
});