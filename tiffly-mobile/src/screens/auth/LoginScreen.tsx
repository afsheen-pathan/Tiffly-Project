// src/screens/auth/LoginScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Button, Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SignInData } from '../../services/userService'; // We still need the type
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext'; // Import our context hook

// 1. Define the validation schema with Zod
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen = ({ navigation }: Props) => {
  // --- THIS IS THE FIX (PART 1) ---
  // Get 'signIn' and 'loading' from our context, not local state
  const { signIn, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  // REMOVED: const [loading, setLoading] = useState(false);
  // ---------------------------------

  // 2. Setup React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // --- THIS IS THE FIX (PART 2) ---
  const onSignInPressed = async (data: SignInData) => {
    if (loading) return;
    setError(null);

    // Call the 'signIn' function from our context
    const result = await signIn(data);

    // Narrow the union type: check if result has an 'error' property
    if (result && 'error' in result) {
      setError('Failed to sign in. Please check your email or password.');
      return;
    }

    // No 'setLoading(false)' needed, context handles it
    // If successful, RootNavigator will auto-switch
  };
  // ---------------------------------

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome Back!
      </Text>

      {/* Email Input */}
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
      {errors.email && (
        <Text style={styles.errorText}>{errors.email.message}</Text>
      )}

      {/* Password Input */}
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
      {errors.password && (
        <Text style={styles.errorText}>{errors.password.message}</Text>
      )}

      {/* Display general error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* --- THIS IS THE FIX (PART 3) --- */}
      {/* The 'disabled' and 'loading' props now correctly */}
      {/* use the 'loading' state from our context */}
      <Button
        mode="contained"
        onPress={handleSubmit(onSignInPressed)}
        disabled={loading} 
        style={styles.button}
      >
        {loading ? ( 
          <ActivityIndicator animating={true} color="#fff" />
        ) : (
          'Login'
        )}
      </Button>
      {/* --------------------------------- */}

      {/* Go to Sign Up Screen */}
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>
          Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// 4. Add some styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#f6f6f6', // Light background for the input
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
  },
});