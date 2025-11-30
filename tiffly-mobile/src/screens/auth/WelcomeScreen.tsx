// src/screens/auth/WelcomeScreen.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { StackNavigationProp } from "@react-navigation/stack";

type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
};

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, "Welcome">;
};

// Better food-delivery background
const BACKGROUND_IMAGE =
  "https://img.freepik.com/free-photo/high-angle-delicious-pakistan-meal-arrangement-basket_23-2148821574.jpg?semt=ais_hybrid&w=740&q=80";

const { height } = Dimensions.get("window");

export const WelcomeScreen = ({ navigation }: Props) => {
  // --- Animation Values ---
  const fadeAnim = useRef(new Animated.Value(0)).current;       // opacity
  const translateY = useRef(new Animated.Value(20)).current;    // slight move up

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.timing(translateY, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: BACKGROUND_IMAGE }}
        resizeMode="cover"
        style={styles.imageBackground}
      >
        <View style={styles.overlay} />

        {/* Apply fade + slide animation */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
        >
          <Text variant="headlineLarge" style={styles.title}>
            Fresh, Homemade Meals
          </Text>

          <Text
            variant="headlineLarge"
            style={[styles.title, styles.titleHighlight]}
          >
            Delivered to You 🍲
          </Text>

          <Text style={styles.subtitle}>
            Order or subscribe to tasty, healthy tiffins prepared by trusted home chefs.
          </Text>
        </Animated.View>

        {/* Buttons section - animated too */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
        >
          <Button
            mode="contained"
            onPress={() => navigation.navigate("Login")}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          >
            Sign In
          </Button>

          <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.link}>
              Don’t have an account? <Text style={styles.linkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  imageBackground: {
    flex: 1,
    height,
    justifyContent: "space-between",
    padding: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    marginTop: "30%",
    paddingHorizontal: 12,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  titleHighlight: {
    color: "#e53935", // Matches your SignUp/Login theme
  },
  subtitle: {
    color: "#f1f1f1",
    textAlign: "center",
    fontSize: 16,
    marginTop: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    paddingBottom: 50,
  },
  button: {
    borderRadius: 25,
    paddingVertical: 10,
    backgroundColor: "#e53935",
  },
  buttonLabel: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  link: {
    marginTop: 18,
    textAlign: "center",
    color: "#fff",
    fontSize: 15,
  },
  linkBold: {
    fontWeight: "bold",
    color: "#e53935",
    textDecorationLine: "underline",
  },
});
