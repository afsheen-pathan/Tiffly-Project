// src/screens/provider/BlockedScreen.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Icon, useTheme } from "react-native-paper";

export const BlockedScreen = () => {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Icon source="lock-outline" size={48} color="#e53935" />
      </View>
      <Text variant="headlineMedium" style={styles.title}>
        Feature Locked
      </Text>
      <Text style={styles.subtitle}>
        This feature will be unlocked once your account has been approved by an
        admin.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: "#fafafa",
  },

  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#ffe5e5",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 22,
    color: "#e53935",
  },

  subtitle: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
    paddingHorizontal: 10,
  },
});
