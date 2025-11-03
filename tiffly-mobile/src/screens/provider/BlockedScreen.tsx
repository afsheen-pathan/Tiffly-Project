// src/screens/provider/BlockedScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, useTheme } from 'react-native-paper';

export const BlockedScreen = () => {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Icon source="lock-outline" size={48} color={theme.colors.backdrop} />
      <Text variant="headlineMedium" style={styles.title}>Feature Locked</Text>
      <Text style={styles.subtitle}>
        This feature will be unlocked once your account has been approved by an admin.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
  },
});