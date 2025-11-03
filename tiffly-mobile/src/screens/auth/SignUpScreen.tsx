// src/screens/auth/SignUpScreen.tsx

import React, { useState } from 'react'; // Keep useState
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Button, Text, TextInput, ActivityIndicator, SegmentedButtons, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUp, SignUpData } from '../../services/userService';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ... (schema and types remain the same)
const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'provider'], { required_error: 'Please select a role' }),
});

type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'SignUp'>;
};

export const SignUpScreen = ({ navigation }: Props) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- THIS IS THE FIX (PART 1) ---
  const [success, setSuccess] = useState(false); // New state
  // ---------------------------------

  const { control, handleSubmit, formState: { errors } } = useForm<SignUpData>({
    // ... (rest of useForm is the same)
  });

  // --- THIS IS THE FIX (PART 2) ---
  const onSignUpPressed = async (data: SignUpData) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    // This still logs the user out
    const { success, error } = await signUp(data); 

    setLoading(false);
    if (error) {
      setError('Failed to create account. This email may already be in use.');
    } else if (success) {
      // Instead of navigating, we just set state.
      // This is safe and won't crash.
      setSuccess(true);
    }
  };
  // ---------------------------------

  // --- THIS IS THE FIX (PART 3) ---
  // If sign up was successful, show a success message
  if (success) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 30 }]}>
        <Icon name="check-circle-outline" size={64} color={theme.colors.primary} />
        <Text variant="headlineMedium" style={{ marginTop: 24, textAlign: 'center' }}>
          Account Created!
        </Text>
        <Text style={{ marginTop: 8, textAlign: 'center' }}>
          Your account has been successfully created. Please log in to continue.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: 24, width: '100%' }}
        >
          Go to Login
        </Button>
      </View>
    );
  }
  // ---------------------------------

  // Otherwise, show the form (this is all your existing code)
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
      
      <Controller
        control={control}
        name="role"
        render={({ field: { onChange, value } }) => (
          <SegmentedButtons
            value={value}
            onValueChange={onChange}
            style={styles.segment}
            buttons={[
              { value: 'customer', label: 'I am a Customer' },
              { value: 'provider', label: 'I am a Provider' },
            ]}
          />
        )}
      />
      {errors.role && <Text style={styles.errorText}>{errors.role.message}</Text>}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Email"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            error={!!errors.email}
          />
        )}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
      
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Password"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            secureTextEntry
            style={styles.input}
            error={!!errors.password}
          />
        )}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button
        mode="contained"
        onPress={handleSubmit(onSignUpPressed)}
        disabled={loading}
        style={styles.button}
      >
        {loading ? <ActivityIndicator animating={true} color="#fff" /> : 'Create Account'}
      </Button>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>
          Already have an account? <Text style={styles.linkBold}>Login</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ... (styles are all the same)
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  segment: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#f6f6f6',
  },
  button: {
    marginTop: 16,
    paddingVertical: 4,
  },
  errorText: {
    color: 'red',
    alignSelf: 'flex-start',
    marginLeft: 4,
    marginBottom: 8,
  },
  link: {
    marginTop: 20,
    textAlign: 'center',
  },
  linkBold: {
    fontWeight: 'bold',
  }
});