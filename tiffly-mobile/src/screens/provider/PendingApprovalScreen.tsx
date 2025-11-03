// src/screens/provider/PendingApprovalScreen.tsx
import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

export const PendingApprovalScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text variant="headlineMedium">Application Submitted!</Text>
      <Text>We are reviewing your profile.</Text>
    </View>
  );
};