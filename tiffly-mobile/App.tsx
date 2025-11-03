// App.tsx
import React, { useEffect, useRef } from 'react';
import { LogBox, View, Text } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { en, registerTranslation } from 'react-native-paper-dates';
import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';

registerTranslation('en', en);

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications (remote notifications) functionality"
]);

// Your key is correctly pasted here
const STRIPE_PUBLISHABLE_KEY = "pk_test_51PRQM2H2zkUocTLd5hpdqrRkrV4rBM1hsAnVG4jTj7Rm8fOe3Pg3XluMqysrrPMlHHu1bgNY77gfvjn3ZUVr6hxN00UwwAPnlP";

// --- Notification Handlers (FIXED) ---
// This handles notifications that arrive WHILE the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // Add default values for other properties to satisfy the type
    priority: Notifications.AndroidNotificationPriority.DEFAULT, 
  }),
});
// ------------------------------------

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    // This listener runs when a user taps on a notification
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[Notifications] User tapped notification:', response);
      
      if (navigationRef.current) {
        // Navigate to the 'Notifications' screen
        // This relies on BOTH Customer and Provider tabs having a 'Notifications' screen
        navigationRef.current.navigate('Notifications');
      }
    });

    return () => subscription.remove();
  }, []);
  // ------------------------------------

  // --- Stripe Key Check (FIXED) ---
  // Compare against the placeholder, NOT your real key
  if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === "pk_test_YOUR_PUBLISHABLE_KEY") {
    // Error screen if key is missing
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
        <Text style={{fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: 'red'}}>
          Stripe Publishable Key is missing!
        </Text>
        <Text style={{marginTop: 10, textAlign: 'center'}}>
          Please add your `STRIPE_PUBLISHABLE_KEY` to App.tsx to continue.
        </Text>
      </View>
    );
  }
  // --- END FIX ---

  // Pass the navigator ref to the RootNavigator
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <PaperProvider>
        <AuthProvider>
          {/* Pass the ref to RootNavigator */}
          <RootNavigator navigationRef={navigationRef} /> 
          <StatusBar style="auto" />
        </AuthProvider>
      </PaperProvider>
    </StripeProvider>
  );
}