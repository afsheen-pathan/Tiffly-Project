// src/screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  Button,
  Text,
  TextInput,
  ActivityIndicator,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SignInData } from "../../services/userService";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";

const { height } = Dimensions.get("window");
const backgroundImage =
  "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=1974&auto=format&fit=crop&q=80";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, "Login">;
};

export const LoginScreen = ({ navigation }: Props) => {
  const { signIn, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSignInPressed = async (data: SignInData) => {
    if (loading) return;
    setError(null);
    const result = await signIn(data);
    if (result && "error" in result) {
      setError("Failed to sign in. Please check your email or password.");
    }
  };

  return (
    <ImageBackground
      source={{ uri: backgroundImage }}
      resizeMode="cover"
      style={styles.background}
    >
      {/* overlay for readability */}
      <View style={styles.overlay} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <MaterialCommunityIcons
            name="food-variant"
            size={60}
            color="#e53935"
            style={{ alignSelf: "center", marginBottom: 8 }}
          />

          <Text variant="headlineMedium" style={styles.title}>
            Welcome Back!
          </Text>
          <Text style={styles.subtitle}>
            Sign in to continue enjoying homemade meals 🍱
          </Text>

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Email"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                error={!!errors.email}
                left={<TextInput.Icon icon="email-outline" color="#e53935" />}
              />
            )}
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email.message}</Text>
          )}

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Password"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                style={styles.input}
                error={!!errors.password}
                left={<TextInput.Icon icon="lock-outline" color="#e53935" />}
              />
            )}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          )}

          {error && (
            <Text style={[styles.errorText, { textAlign: "center" }]}>
              {error}
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit(onSignInPressed)}
            disabled={loading}
            style={[styles.button, { backgroundColor: "#e53935" }]}
            labelStyle={{ fontSize: 16, fontWeight: "bold" }}
          >
            {loading ? (
              <ActivityIndicator animating={true} color="#fff" />
            ) : (
              "Login"
            )}
          </Button>

          <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.link}>
              Don’t have an account?{" "}
              <Text style={styles.linkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, height },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.98)",
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#e53935",
  },
  subtitle: {
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
    marginTop: 6,
    fontSize: 15,
  },
  input: {
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  button: {
    marginTop: 18,
    paddingVertical: 10,
    borderRadius: 25,
  },
  errorText: {
    color: "red",
    marginBottom: 8,
    fontSize: 13,
  },
  link: {
    marginTop: 18,
    textAlign: "center",
    color: "#555",
  },
  linkBold: { fontWeight: "bold", color: "#e53935" },
});
