// App.tsx
import React, { useEffect, useRef } from 'react';
import { LogBox, View, Text } from 'react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
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

// ------------------ TIFFLY THEME ------------------
const TifflyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#e53935',      // Main brand color
    secondary: '#ff7043',    // Accent
    background: '#fafafa',
    surface: '#ffffff',
    text: '#222222',
    placeholder: '#888',
  },
};
// --------------------------------------------------

// Your Stripe key
const STRIPE_PUBLISHABLE_KEY = "pk_test_51PRQM2H2zkUocTLd5hpdqrRkrV4rBM1hsAnVG4jTj7Rm8fOe3Pg3XluMqysrrPMlHHu1bgNY77gfvjn3ZUVr6hxN00UwwAPnlP";

// --- Notification Handlers ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.DEFAULT,
  }),
});

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[Notifications] User tapped notification:', response);

      if (navigationRef.current) {
        navigationRef.current.navigate('Notifications');
      }
    });

    return () => subscription.remove();
  }, []);

  if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === "pk_test_YOUR_PUBLISHABLE_KEY") {
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

  // ---------------- APP RENDER ----------------
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <PaperProvider theme={TifflyTheme}> 
        <AuthProvider>
          <RootNavigator navigationRef={navigationRef} />
          <StatusBar style="light" />
        </AuthProvider>
      </PaperProvider>
    </StripeProvider>
  );
}
