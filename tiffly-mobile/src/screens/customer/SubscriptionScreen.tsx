// src/screens/customer/SubscriptionScreen.tsx
import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  Card,
  ActivityIndicator,
  Button,
  Divider,
  useTheme,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import {
  getUserActiveSubscription,
  Subscription,
  updateSubscriptionStatus,
} from "../../services/userService";
import { scheduleLocalNotification } from "../../services/notificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";
// 1. Make sure all date-fns functions are imported
import {
  format,
  differenceInDays,
  subDays,
  differenceInCalendarDays,
} from "date-fns";
import { DatePickerModal } from "react-native-paper-dates";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Key for AsyncStorage to track if reminder was scheduled
const REMINDER_STORAGE_KEY_PREFIX = "@subscription_reminder_sent_";

export const SubscriptionScreen = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Pause Date Picker Modal
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [pauseRange, setPauseRange] = useState<{
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({ startDate: undefined, endDate: undefined });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // --- Data Fetching ---
  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError("You must be logged in.");
      return;
    }
    setLoading(true);
    setError(null);
    setSubscription(null);
    const { subscription: fetchedSubscription, error: fetchError } =
      await getUserActiveSubscription(user.uid);
    if (fetchError) {
      setError(
        typeof fetchError === "string"
          ? fetchError
          : "Failed to load subscription."
      );
    } else {
      setSubscription(fetchedSubscription);
    }
    setLoading(false);
  }, [user]);

  // --- 2. FIX: Correct use of useFocusEffect ---
  useFocusEffect(
    useCallback(() => {
      fetchSubscription(); // Call the async function *inside* the callback
    }, [fetchSubscription])
  );
  // --- END FIX ---

  // --- 3. FIX: Correct use of useEffect for Reminder ---
  useEffect(() => {
    // Define the async function *inside* the effect
    const checkAndScheduleReminder = async () => {
      if (!subscription || subscription.status !== "active") {
        return;
      }

      const { id: subId, endDate: subEndDate } = subscription;
      const reminderKey = `${REMINDER_STORAGE_KEY_PREFIX}${subId}`;
      const reminderSent = await AsyncStorage.getItem(reminderKey);

      if (reminderSent) {
        console.log(
          `[Notifications] Reminder already scheduled for sub ${subId}`
        );
        return;
      }

      const endDate = subEndDate.toDate();
      const now = new Date();
      const daysUntilRenewal = differenceInDays(endDate, now);

      if (daysUntilRenewal <= 3 && daysUntilRenewal >= 0) {
        const reminderDate = subDays(endDate, 1);
        reminderDate.setHours(9, 0, 0, 0);
        // const reminderDate = new Date(Date.now() + 5000);

        if (reminderDate > now) {
          // console.log(
          //   `[Notifications] Scheduling renewal reminder for sub ${subId} at ${reminderDate.toISOString()}`
          // );
          console.log(`[Notifications] Scheduling TEST reminder for 5 seconds from now...`);
          await scheduleLocalNotification(
            "Subscription Renewal Reminder 📅",
            `Your "${subscription.planName}" subscription will renew in 1 day.`,
            reminderDate
          );
          await AsyncStorage.setItem(reminderKey, "true");
        }
      }
    };

    // Call the async function from inside the effect
    checkAndScheduleReminder();

    // The effect itself returns 'void' (nothing), which is correct
  }, [subscription]); // Dependency array is correct
  // --- END FIX ---

  // --- Pause/Resume Logic ---
  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);

  const onConfirmPauseDates = useCallback(
    ({
      startDate,
      endDate,
    }: {
      startDate: Date | undefined;
      endDate: Date | undefined;
    }) => {
      setDatePickerVisible(false);
      if (startDate && endDate && subscription?.id) {
        const daysPaused = differenceInCalendarDays(endDate, startDate) + 1;
        if (daysPaused <= 0) {
          Alert.alert(
            "Invalid Range",
            "End date must be on or after start date."
          );
          return;
        }
        Alert.alert(
          "Confirm Pause",
          `Pause service from ${format(startDate, "MMM d")} to ${format(
            endDate,
            "MMM d"
          )} (${daysPaused} days)? Your renewal date will be extended.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Confirm Pause",
              onPress: () =>
                handlePauseConfirm(subscription.id, endDate, daysPaused),
            },
          ]
        );
      } else {
        Alert.alert("Error", "Please select both a start and end date.");
      }
    },
    [subscription]
  );

  const handlePauseConfirm = async (
    subId: string,
    pauseUntilDate: Date,
    daysPaused: number
  ) => {
    setIsUpdatingStatus(true);
    const { success, error: updateError } = await updateSubscriptionStatus(
      subId,
      "paused",
      pauseUntilDate,
      daysPaused
    );
    setIsUpdatingStatus(false);
    if (success) {
      Alert.alert(
        "Success",
        "Subscription paused. Your renewal date has been updated."
      );
      fetchSubscription();
    } else {
      Alert.alert("Error", updateError || "Failed to pause subscription.");
    }
  };

  const handleResume = async () => {
    if (!subscription?.id) return;
    setIsUpdatingStatus(true);
    const { success, error: updateError } = await updateSubscriptionStatus(
      subscription.id,
      "active",
      null,
      0
    );
    setIsUpdatingStatus(false);
    if (success) {
      Alert.alert("Success", "Subscription resumed.");
      fetchSubscription();
    } else {
      Alert.alert("Error", updateError || "Failed to resume subscription.");
    }
  };

  // --- Render States ---
  if (loading) {
    return (
      <ActivityIndicator animating={true} style={styles.loader} size="large" />
    );
  }
  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }
  if (!subscription) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>
          No active or paused subscription found.
        </Text>
      </View>
    );
  }

  // --- Render Active/Paused Subscription ---
  const startDate = subscription.startDate.toDate();
  const endDate = subscription.endDate.toDate();
  const pausedUntilDate = subscription.pausedUntil?.toDate();

  return (
    <>
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Title
            title="Current Subscription"
            titleVariant="headlineMedium"
            subtitle={
              subscription.status === "paused" && pausedUntilDate
                ? `Paused until ${format(pausedUntilDate, "MMM d, yyyy")}`
                : "Active"
            }
            subtitleStyle={
              subscription.status === "paused"
                ? styles.statusPaused
                : styles.statusActive
            }
          />
          <Card.Content>
            <Text style={styles.planName}>{subscription.planName}</Text>
            <Text style={styles.kitchenName}>
              From: {subscription.kitchenName || "Loading..."}
            </Text>
            <Divider style={styles.divider} />
            <View style={styles.detailRow}>
              <Icon
                name="calendar-arrow-right"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.detailLabel}>Started On:</Text>
              <Text style={styles.detailValue}>
                {format(startDate, "MMM d, yyyy")}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon
                name="calendar-arrow-left"
                size={20}
                color={theme.colors.error}
              />
              <Text style={styles.detailLabel}>Next Renewal:</Text>
              <Text style={styles.detailValue}>
                {format(endDate, "MMM d, yyyy")}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon
                name="tag-outline"
                size={20}
                color={theme.colors.secondary}
              />
              <Text style={styles.detailLabel}>Frequency:</Text>
              <Text style={styles.detailValue}>
                {subscription.planFrequency}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon
                name="information-outline"
                size={20}
                color={theme.colors.tertiary}
              />
              <Text style={styles.detailLabel}>Status:</Text>
              <Text
                style={
                  subscription.status === "paused"
                    ? styles.statusPaused
                    : styles.statusActive
                }
              >
                {subscription.status}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Manage Service" />
          <Card.Content>
            {subscription.status === "active" && (
              <>
                <Text style={styles.pauseInfo}>
                  Need a break? Pause your service for specific dates. Your
                  renewal date will be automatically extended.
                </Text>
                <Button
                  mode="contained"
                  onPress={showDatePicker}
                  icon="calendar-month-outline"
                  style={styles.actionButton}
                  loading={isUpdatingStatus}
                  disabled={isUpdatingStatus}
                >
                  Pause Service
                </Button>
              </>
            )}
            {subscription.status === "paused" && (
              <>
                <Text style={styles.pauseInfo}>
                  Your service is currently paused. Resume anytime.
                </Text>
                <Button
                  mode="contained"
                  onPress={handleResume}
                  icon="calendar-play"
                  style={styles.actionButton}
                  loading={isUpdatingStatus}
                  disabled={isUpdatingStatus}
                >
                  Resume Service
                </Button>
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <DatePickerModal
        locale="en"
        mode="range"
        visible={isDatePickerVisible}
        onDismiss={hideDatePicker}
        startDate={pauseRange.startDate}
        endDate={pauseRange.endDate}
        onConfirm={onConfirmPauseDates}
        validRange={{ startDate: new Date() }}
      />
    </>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { textAlign: "center", color: "red", fontSize: 16 },
  emptyText: { textAlign: "center", fontSize: 16, color: "gray" },
  card: { margin: 16, elevation: 2 },
  planName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  kitchenName: { fontSize: 16, color: "gray", marginBottom: 12 },
  divider: { marginVertical: 12, height: 1.5 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  detailLabel: {
    fontSize: 15,
    color: "#555",
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  detailValue: { fontSize: 15, color: "#333", textAlign: "right" },
  statusActive: {
    color: "green",
    fontWeight: "bold",
    textTransform: "capitalize",
    textAlign: "right",
  },
  statusPaused: {
    color: "orange",
    fontWeight: "bold",
    textTransform: "capitalize",
    textAlign: "right",
  },
  pauseInfo: {
    marginBottom: 16,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  actionButton: { marginTop: 8, paddingVertical: 4 },
});
