// src/screens/auth/SignUpScreen.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Dimensions,
} from "react-native";
import {
  Button,
  Text,
  TextInput,
  ActivityIndicator,
  Card,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signUp } from "../../services/userService";
import type { SignUpData } from "../../services/userService";
import { StackNavigationProp } from "@react-navigation/stack";
// Use expo vector icons (works in Expo projects)
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");
const backgroundImage =
  "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=1974&auto=format&fit=crop&q=80"; // appetizing food backdrop

// Validation schema
const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["customer", "provider"], {
    required_error: "Please select a role",
  }),
});

type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, "SignUp">;
};

export const SignUpScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", role: undefined },
  });

  const onSignUpPressed = async (data: SignUpData) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    const { success, error } = await signUp(data);
    setLoading(false);
    if (error)
      setError("Failed to create account. This email may already be in use.");
    else if (success) setSuccess(true);
  };

  // --- Success screen (solid warm background, no LinearGradient) ---
  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successInner}>
          <MaterialCommunityIcons name="check-circle" size={96} color="#fff" />
          <Text variant="headlineMedium" style={styles.successTitle}>
            Account Created!
          </Text>
          <Text style={styles.successSubtitle}>
            Your account has been successfully created.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("Login")}
            style={[styles.button, styles.successButton]}
            labelStyle={styles.successButtonLabel}
          >
            Go to Login
          </Button>
        </View>
      </View>
    );
  }

  // --- Sign Up Form ---
  return (
    <ImageBackground
      source={{ uri: backgroundImage }}
      resizeMode="cover"
      style={styles.background}
    >
      {/* translucent white overlay to make content readable */}
      <View style={styles.overlay} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text variant="headlineMedium" style={styles.title}>
            Join Tiffly
          </Text>
          <Text style={styles.subtitle}>Delicious meals at your doorstep 🍱</Text>

          {/* Role Selector */}
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <View style={styles.roleContainer}>
                {/* Customer */}
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => onChange("customer")}
                  activeOpacity={0.9}
                >
                  <Card
                    style={[
                      styles.roleCard,
                      value === "customer" && styles.roleCardSelected,
                    ]}
                    elevation={value === "customer" ? 4 : 1}
                  >
                    <MaterialCommunityIcons
                      name="food"
                      size={38}
                      color={value === "customer" ? "#e53935" : "#999"}
                    />
                    <Text
                      style={[
                        styles.roleText,
                        value === "customer" && { color: "#e53935" },
                      ]}
                    >
                      Customer
                    </Text>
                  </Card>
                </TouchableOpacity>

                {/* Provider */}
                <TouchableOpacity
                  style={{ flex: 1, marginLeft: 12 }}
                  onPress={() => onChange("provider")}
                  activeOpacity={0.9}
                >
                  <Card
                    style={[
                      styles.roleCard,
                      value === "provider" && styles.roleCardSelected,
                    ]}
                    elevation={value === "provider" ? 4 : 1}
                  >
                    <MaterialCommunityIcons
                      name="chef-hat"
                      size={38}
                      color={value === "provider" ? "#e53935" : "#999"}
                    />
                    <Text
                      style={[
                        styles.roleText,
                        value === "provider" && { color: "#e53935" },
                      ]}
                    >
                      Provider
                    </Text>
                  </Card>
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.role && (
            <Text style={styles.errorText}>{errors.role.message}</Text>
          )}

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
            onPress={handleSubmit(onSignUpPressed)}
            disabled={loading}
            style={[styles.button, { backgroundColor: "#ff512f" }]}
            labelStyle={{ fontSize: 16 }}
          >
            {loading ? (
              <ActivityIndicator animating={true} color="#fff" />
            ) : (
              "Create Account"
            )}
          </Button>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>
              Already have an account?{" "}
              <Text style={styles.linkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, height: height },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.98)",
    padding: 20,
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
    marginBottom: 18,
    marginTop: 6,
    fontSize: 15,
  },
  roleContainer: {
    flexDirection: "row",
    marginBottom: 14,
  },
  roleCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  roleCardSelected: {
    borderColor: "#e53935",
    backgroundColor: "#fff5f4",
  },
  roleText: { marginTop: 8, fontWeight: "600", color: "#333" },
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

  successContainer: {
    flex: 1,
    backgroundColor: "#ff7043", // warm orange-red solid
    justifyContent: "center",
  },
  successInner: {
    alignItems: "center",
    padding: 28,
    backgroundColor: "transparent",
  },
  successTitle: {
    marginTop: 18,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
  },
  successSubtitle: {
    marginTop: 8,
    color: "#fff",
    textAlign: "center",
  },
  successButton: {
    marginTop: 22,
    width: "72%",
    borderRadius: 25,
    backgroundColor: "#fff",
  },
  successButtonLabel: {
    color: "#e53935",
    fontWeight: "700",
  },
});
