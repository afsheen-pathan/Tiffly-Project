// src/navigation/RootNavigator.tsx
import React, { forwardRef } from 'react'; // 1. Import forwardRef
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
// 2. Import NavigationContainerRef
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';

// Simple loading screen
const LoadingScreen = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" />
  </View>
);

// 3. Define props for the ref
interface RootNavigatorProps {
  // This type allows us to pass a ref from App.tsx to the NavigationContainer
  navigationRef: React.Ref<NavigationContainerRef<any>>;
}

// 4. Wrap the component in forwardRef
// The first generic is the type of ref, the second is the type of props
export const RootNavigator = forwardRef<NavigationContainerRef<any>, RootNavigatorProps>(
  (props, ref) => {
    const { user, loading } = useAuth(); // Get user state from our context

    // Show a loading spinner while AuthContext is checking
    if (loading) {
      return <LoadingScreen />;
    }

    // This is the "switcher" logic
    return (
      // 5. Pass the 'ref' from forwardRef to the NavigationContainer
      <NavigationContainer ref={ref}>
        {user ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    );
  }
);
// ------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});