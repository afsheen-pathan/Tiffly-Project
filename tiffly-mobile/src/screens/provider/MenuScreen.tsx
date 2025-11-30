// src/screens/provider/MenuScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, Alert, ScrollView } from "react-native";
import {
  Text,
  Button,
  List,
  ActivityIndicator,
  FAB,
  Portal,
  Modal,
  TextInput,
  useTheme,
  IconButton,
} from "react-native-paper"; // Added IconButton
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import {
  getProviderPlans,
  addProviderPlan,
  deleteProviderPlan,
  updateProviderPlan,
  Plan,
} from "../../services/userService"; // Added updateProviderPlan
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Picker } from "@react-native-picker/picker";
import { PlanDetailModal } from "../../components/PlanDetailModal";
import { useNavigation } from "@react-navigation/native"; // 1. Import useNavigation
import { StackNavigationProp } from "@react-navigation/stack"; // 2. Import Stack prop
import { MenuStackParamList } from "../../navigation/ProviderTabNavigator"; // 3. Import the param list

// --- Validation Schema (Price validated as string, converted later) ---
const planSchema = z.object({
  planName: z.string().min(3, "Plan name is required (min 3 chars)"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Price must be a positive number",
    }),
  mealType: z.enum(["Lunch", "Dinner"], { required_error: "Select Meal Type" }),
  frequency: z.enum(["Weekly", "Monthly"], {
    required_error: "Select Frequency",
  }),
  description: z.string().optional(),
});

// 4. Define the navigation prop type
type MenuScreenNavigationProp = StackNavigationProp<
  MenuStackParamList,
  "PlanList"
>;

export const MenuScreen = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const navigation = useNavigation<MenuScreenNavigationProp>();

  // Type for form data matching the schema *before* price conversion
  type PlanFormInput = z.infer<typeof planSchema>;
  // Type for data *after* manual price conversion
  type PlanDataForService = Omit<PlanFormInput, "price"> & { price: number };

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- State for Edit Mode ---
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  // --------------------------

  // --- ADD State for View Modal ---
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<Plan | null>(null);

  // --- React Hook Form ---
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PlanFormInput>({
    resolver: zodResolver(planSchema),
    // Default values for the form
    defaultValues: {
      planName: "",
      price: "", // Start as string
      mealType: undefined, // Let Picker show placeholder
      frequency: undefined, // Let Picker show placeholder
      description: "",
    },
  });

  // --- Function to fetch plans (with logs) ---
  const fetchPlans = useCallback(async () => {
    if (!user) {
      console.log("[fetchPlans] No user found."); // Log if no user
      setError("Not logged in."); // Set error if no user
      setLoading(false);
      return;
    }
    console.log("[fetchPlans] Starting fetch..."); // Log start
    setLoading(true);
    setError(null);
    // Don't clear plans here immediately for smoother refresh
    // setPlans([]);

    const { plans: fetchedPlans, error: fetchError } = await getProviderPlans(
      user.uid
    );

    if (fetchError) {
      console.error("[fetchPlans] Error fetching:", fetchError); // Log error
      setError("Failed to load plans.");
      setPlans([]); // Ensure plans are empty on error
    } else if (fetchedPlans) {
      console.log("[fetchPlans] Success! Fetched plans:", fetchedPlans); // Log fetched data
      setPlans(fetchedPlans);
    } else {
      console.log("[fetchPlans] No plans returned, but no error."); // Log if undefined/null returned
      setPlans([]); // Ensure plans are empty
    }
    setLoading(false);
    console.log("[fetchPlans] Fetch complete."); // Log end
  }, [user]);

  // --- Fetch plans on focus ---
  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [fetchPlans])
  );

  // --- ADD View Modal Handlers ---
  const showViewModal = (plan: Plan) => {
    setViewingPlan(plan);
    setIsViewModalVisible(true);
  };
  const hideViewModal = () => {
    setIsViewModalVisible(false);
    setViewingPlan(null);
  };
  // ---------------------------

  // --- Modal Handlers ---
  const showAddModal = () => {
    setEditingPlan(null);
    reset({
      // Reset with defaults for adding
      planName: "",
      price: "",
      mealType: undefined,
      frequency: undefined,
      description: "",
    });
    setIsModalVisible(true);
  };

  const showEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setValue("planName", plan.planName);
    setValue("price", String(plan.price)); // Convert number back to string for input
    setValue("mealType", plan.mealType);
    setValue("frequency", plan.frequency);
    setValue("description", plan.description || "");
    setIsModalVisible(true);
  };

  const hideModal = () => {
    setIsModalVisible(false);
    setEditingPlan(null);
    reset(); // Clear form state
  };

  // --- Handle Add or Update Plan ---
  const onPlanSubmit: SubmitHandler<PlanFormInput> = async (data) => {
    if (!user) return;
    setIsSubmitting(true);

    const priceAsNumber = parseFloat(data.price);
    if (isNaN(priceAsNumber)) {
      Alert.alert("Error", "Invalid price entered.");
      setIsSubmitting(false);
      return;
    }
    // Prepare data with price as number for saving
    const planDataForService: PlanDataForService = {
      ...data,
      price: priceAsNumber,
    };

    let result: { success?: boolean; error?: any; planId?: string };

    if (editingPlan && editingPlan.id) {
      // Update Existing Plan
      console.log(`[onPlanSubmit] Updating plan ID: ${editingPlan.id}`);
      result = await updateProviderPlan(
        user.uid,
        editingPlan.id,
        planDataForService
      );
    } else {
      // Add New Plan
      console.log("[onPlanSubmit] Adding new plan");
      result = await addProviderPlan(user.uid, planDataForService);
    }

    setIsSubmitting(false);

    if (result.error) {
      console.error(`[onPlanSubmit] Error:`, result.error);
      Alert.alert(
        "Error",
        `Could not ${editingPlan ? "update" : "add"} plan. Please try again.`
      );
    } else {
      console.log(
        `[onPlanSubmit] ${editingPlan ? "Update" : "Add"} successful.`
      );
      hideModal();
      fetchPlans(); // Refresh the list
    }
  };

  // --- Handle Delete Plan ---
  const handleDeletePlan = (plan: Plan) => {
    if (!user || !plan.id) return;
    Alert.alert(
      "Delete Plan",
      `Are you sure you want to delete "${plan.planName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log(`[handleDeletePlan] Deleting plan ID: ${plan.id}`);
            const { success, error: deleteError } = await deleteProviderPlan(
              user.uid!,
              plan.id!
            );
            if (deleteError) {
              console.error(`[handleDeletePlan] Error:`, deleteError);
              Alert.alert("Error", "Could not delete plan.");
            } else {
              console.log(`[handleDeletePlan] Delete successful.`);
              fetchPlans(); // Refresh list
            }
          },
        },
      ]
    );
  };

  // --- Render Item for FlatList ---
  const renderPlanItem = ({ item }: { item: Plan }) => (
    <List.Item
      title={item.planName}
      description={`₹${item.price} (${item.frequency}, ${item.mealType})${
        item.description ? ` - ${item.description}` : ""
      }`}
      titleStyle={styles.planTitle}
      descriptionStyle={styles.planDescription}
      // 4. Add onPress to List.Item to show view modal
      onPress={() => showViewModal(item)}
      right={(props) => (
        <View {...props} style={styles.actionButtons}>
          {/* Edit Button */}
          <IconButton
            icon="pencil-outline"
            size={20}
            onPress={() => showEditModal(item)}
            style={styles.iconButton}
          />
          {/* Delete Button */}
          <IconButton
            icon="delete-outline"
            iconColor={theme.colors.error}
            size={20}
            onPress={() => handleDeletePlan(item)}
            style={styles.iconButton}
          />
        </View>
      )}
      style={styles.listItem}
    />
  );

  // --- Main Return ---
  return (
    <View style={styles.container}>
      {/* Show loader only on initial load */}
      {loading && plans.length === 0 && (
        <ActivityIndicator animating={true} style={styles.loader} />
      )}
      {/* Show error only if not loading */}
      {!loading && error && <Text style={styles.errorText}>{error}</Text>}

      {/* FlatList handles empty state with ListEmptyComponent */}
      <FlatList
        data={plans}
        renderItem={renderPlanItem}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={
          plans.length === 0 ? styles.centerContainer : styles.listContent
        }
        // --- 6. ADD ListHeaderComponent ---
        ListHeaderComponent={
          <Button
            mode="contained-tonal"
            icon="calendar-edit"
            style={styles.weeklyMenuButton}
            labelStyle={{ color: "#fff" }}
            onPress={() => navigation.navigate("WeeklyMenu")}
          >
            Set Daily Menu for the Week
          </Button>
        }
        // --- END ADD ---
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                You haven't added any plans yet.
              </Text>
              <Text style={styles.emptySubText}>
                (Tap the '+' button below)
              </Text>
            </View>
          ) : null
        }
        // Add RefreshControl if needed later
        // refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPlans} />}
      />

      <FAB icon="plus" color="#fff" style={styles.fab} onPress={showAddModal} />
      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Text variant="headlineMedium" style={styles.modalTitle}>
              {editingPlan ? "Edit Plan" : "Add New Plan"}
            </Text>

            {/* Plan Name Input */}
            <Controller
              name="planName"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Plan Name..."
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.planName}
                  style={styles.input}
                />
              )}
            />
            {errors.planName && (
              <Text style={styles.errorTextModal}>
                {errors.planName.message}
              </Text>
            )}

            {/* Price Input */}
            <Controller
              name="price"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Price (₹)"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.price}
                  keyboardType="numeric"
                  style={styles.input}
                />
              )}
            />
            {errors.price && (
              <Text style={styles.errorTextModal}>{errors.price.message}</Text>
            )}

            {/* Meal Type Picker */}
            <Controller
              name="mealType"
              control={control}
              render={({ field: { onChange, value } }) => (
                <View
                  style={[
                    styles.pickerWrapper,
                    errors.mealType && styles.pickerError,
                  ]}
                >
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    <Picker.Item
                      label="Select Meal Type..."
                      value={undefined}
                      enabled={false}
                      style={styles.pickerPlaceholder}
                    />
                    <Picker.Item label="Lunch" value="Lunch" />
                    <Picker.Item label="Dinner" value="Dinner" />
                  </Picker>
                </View>
              )}
            />
            {errors.mealType && (
              <Text style={styles.errorTextModal}>
                {errors.mealType.message}
              </Text>
            )}

            {/* Frequency Picker */}
            <Controller
              name="frequency"
              control={control}
              render={({ field: { onChange, value } }) => (
                <View
                  style={[
                    styles.pickerWrapper,
                    errors.frequency && styles.pickerError,
                  ]}
                >
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    <Picker.Item
                      label="Select Frequency..."
                      value={undefined}
                      enabled={false}
                      style={styles.pickerPlaceholder}
                    />
                    <Picker.Item label="Weekly" value="Weekly" />
                    <Picker.Item label="Monthly" value="Monthly" />
                  </Picker>
                </View>
              )}
            />
            {errors.frequency && (
              <Text style={styles.errorTextModal}>
                {errors.frequency.message}
              </Text>
            )}

            {/* Description Input */}
            <Controller
              name="description"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Description (Optional)"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.description}
                  style={styles.input}
                  multiline
                />
              )}
            />
            {errors.description && (
              <Text style={styles.errorTextModal}>
                {errors.description.message}
              </Text>
            )}

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit(onPlanSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.modalButton}
            >
              {" "}
              {editingPlan ? "Save Changes" : "Add Plan"}{" "}
            </Button>
            <Button
              onPress={hideModal}
              style={styles.modalButton}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </ScrollView>
        </Modal>
      </Portal>

      <PlanDetailModal
        visible={isViewModalVisible}
        onDismiss={hideViewModal}
        plan={viewingPlan}
      />
      {/* ---------------------------------- */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  centerContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    textAlign: "center",
    color: "#e53935",
    fontSize: 16,
    padding: 20,
    fontWeight: "600",
  },

  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#777",
    paddingHorizontal: 20,
  },

  emptySubText: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    color: "#aaa",
  },

  listContent: {
    padding: 12,
    flexGrow: 1,
  },

  listItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 12,
    elevation: 2,
    paddingVertical: 4,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
  },

  planTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#222",
  },

  planDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconButton: {
    marginHorizontal: -2,
  },

  /* FAB Floating Add Button */
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#e53935",
  },

  modalContainer: {
    backgroundColor: "#fff",
    padding: 22,
    margin: 20,
    borderRadius: 12,
    maxHeight: "90%",
    elevation: 3,
  },

  modalTitle: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#e53935",
  },

  input: {
    marginBottom: 10,
    backgroundColor: "#f3f3f3",
    borderRadius: 8,
  },

  errorTextModal: {
    color: "#e53935",
    marginBottom: 6,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "500",
  },

  /* Picker Styling */
  pickerWrapper: {
    borderWidth: 1.3,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#f3f3f3",
  },

  pickerError: {
    borderColor: "#ee4a48ff",
  },

  picker: {
    height: 50,
    width: "100%",
  },

  pickerItem: {
    height: 50,
  },

  pickerPlaceholder: {
    color: "#999",
  },

  modalButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 4,
  },

  weeklyMenuButton: {
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 10,
    paddingVertical: 6,
    color: "#fff",
    backgroundColor: "#e53935",
  },
});
