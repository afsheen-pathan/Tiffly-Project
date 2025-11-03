// src/screens/provider/WeeklyMenuScreen.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Card,
  Divider,
  IconButton,
  useTheme,
} from "react-native-paper";
import { useAuth } from "../../contexts/AuthContext";
import {
  getProviderWeeklyMenu,
  updateProviderWeeklyMenu,
  WeeklyMenu,
} from "../../services/userService";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigation } from "@react-navigation/native";
// 1. REMOVE getDoc, doc, db imports
import { API_BASE_URL } from "../../config/api";

// Zod schema
const menuSchema = z.object({
  monday: z.string().min(3, "Menu is required"),
  tuesday: z.string().min(3, "Menu is required"),
  wednesday: z.string().min(3, "Menu is required"),
  thursday: z.string().min(3, "Menu is required"),
  friday: z.string().min(3, "Menu is required"),
  saturday: z.string().min(3, "Menu is required"),
  sunday: z.string().min(3, "Menu is required"),
});

type MenuFormData = z.infer<typeof menuSchema>;
type MenuForUpdate = Omit<WeeklyMenu, "updatedAt">;

// Read-only view component
const ReadOnlyMenu = ({
  menu,
  onEdit,
}: {
  menu: MenuFormData;
  onEdit: () => void;
}) => {
  const theme = useTheme();
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Current Weekly Menu"
        subtitle="This is what customers see"
        right={(props) => (
          <Button
            {...props}
            icon="pencil"
            onPress={onEdit}
            style={{ marginRight: 8 }}
          >
            Edit
          </Button>
        )}
      />
      <Card.Content>
        {days.map((day) => (
          <View key={day} style={styles.row}>
            <Text style={[styles.dayLabel, { color: theme.colors.primary }]}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </Text>
            <Text style={styles.menuText}>
              {menu[day as keyof MenuFormData] || "Not set"}
            </Text>
          </View>
        ))}
      </Card.Content>
    </Card>
  );
};

export const WeeklyMenuScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // 2. REMOVE kitchenName state
  // const [kitchenName, setKitchenName] = useState<string>('');

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<MenuFormData>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      saturday: "",
      sunday: "",
    },
  });

  // 3. SIMPLIFY useEffect to only fetch menu
  useEffect(() => {
    const fetchMenu = async () => {
      if (!user) return;
      setLoading(true);

      const { menu } = await getProviderWeeklyMenu(user.uid);
      if (menu) {
        setValue("monday", menu.monday || "");
        setValue("tuesday", menu.tuesday || "");
        setValue("wednesday", menu.wednesday || "");
        setValue("thursday", menu.thursday || "");
        setValue("friday", menu.friday || "");
        setValue("saturday", menu.saturday || "");
        setValue("sunday", menu.sunday || "");
      } else {
        setIsEditMode(true);
      }

      setLoading(false);
    };
    fetchMenu();
  }, [user, setValue]);

  // 4. Update onSubmit to only send providerId
  const onSubmit = async (data: MenuFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    const menuData: MenuForUpdate = data;
    const { success, error } = await updateProviderWeeklyMenu(
      user.uid,
      menuData
    );

    if (success) {
      Alert.alert("Success", "Weekly menu has been updated!");
      setIsEditMode(false);

      // --- TRIGGER NOTIFICATION (Simplified) ---
      console.log(
        "[Notifications] Menu updated, triggering notification to subscribers..."
      );
      try {
        console.log("[Notifications] Triggering:", `${API_BASE_URL}/notify-menu-update`);
        await fetch(`${API_BASE_URL}/notify-menu-update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerId: user.uid, // Only send the ID
            // We no longer send kitchenName
          }),
        });
        console.log("[Notifications] Trigger request sent to backend.");
      } catch (notifyError) {
        console.error(
          "[Notifications] Failed to send trigger request:",
          notifyError
        );
      }
      // --------------------------
    } else {
      Alert.alert("Error", error || "Failed to update menu.");
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <ActivityIndicator animating={true} style={styles.loader} size="large" />
    );
  }

  // --- (JSX remains the same) ---
  return (
    <ScrollView style={styles.container}>
      {isEditMode ? (
        <Card style={styles.card}>
          <Card.Title
            title="Update Weekly Menu"
            subtitle="Enter the menu for each day."
            right={(props) => (
              <Button
                {...props}
                onPress={() => setIsEditMode(false)}
                style={{ marginRight: 8 }}
              >
                Cancel
              </Button>
            )}
          />
          <Card.Content>
            <Controller
              name="monday"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Monday Menu"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.monday}
                  style={styles.input}
                  multiline
                />
              )}
            />
            {errors.monday && (
              <Text style={styles.errorText}>{errors.monday.message}</Text>
            )}
            <Controller
              name="tuesday"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Tuesday Menu"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.tuesday}
                  style={styles.input}
                  multiline
                />
              )}
            />
            {errors.tuesday && (
              <Text style={styles.errorText}>{errors.tuesday.message}</Text>
            )}
            <Controller
              name="wednesday"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Wednesday Menu"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.wednesday}
                  style={styles.input}
                  multiline
                />
              )}
            />
            {errors.wednesday && (
              <Text style={styles.errorText}>{errors.wednesday.message}</Text>
            )}
            <Controller
              name="thursday"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Thursday Menu"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.thursday}
                  style={styles.input}
                  multiline
                />
              )}
            />
            {errors.thursday && (
              <Text style={styles.errorText}>{errors.thursday.message}</Text>
            )}
            <Controller
              name="friday"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Friday Menu"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.friday}
                  style={styles.input}
                  multiline
                />
              )}
            />
            {errors.friday && (
              <Text style={styles.errorText}>{errors.friday.message}</Text>
            )}
            <Controller
              name="saturday"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Saturday Menu"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.saturday}
                  style={styles.input}
                  multiline
                />
              )}
            />
            {errors.saturday && (
              <Text style={styles.errorText}>{errors.saturday.message}</Text>
            )}
            <Controller
              name="sunday"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Sunday Menu"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.sunday}
                  style={styles.input}
                  multiline
                />
              )}
            />
            {errors.sunday && (
              <Text style={styles.errorText}>{errors.sunday.message}</Text>
            )}
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.saveButton}
            >
              Save Weekly Menu
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <ReadOnlyMenu menu={getValues()} onEdit={() => setIsEditMode(true)} />
      )}
    </ScrollView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, padding: 8, backgroundColor: "#f5f5f5" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { margin: 8, elevation: 2 },
  input: { marginBottom: 12, backgroundColor: "#f9f9f9" },
  errorText: {
    color: "red",
    fontSize: 12,
    marginLeft: 8,
    marginTop: -8,
    marginBottom: 8,
  },
  saveButton: { marginTop: 20, paddingVertical: 4 },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  dayLabel: { fontSize: 16, fontWeight: "bold", width: 100 },
  menuText: { fontSize: 15, color: "#333", flex: 1, lineHeight: 22 },
});
