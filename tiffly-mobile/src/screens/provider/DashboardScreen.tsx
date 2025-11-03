// src/screens/provider/DashboardScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Text,
  ActivityIndicator,
  List,
  Chip,
  Divider,
  useTheme,
  Card,
  Button,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import {
  getTodaysDeliveries,
  DailyDelivery,
  getUserPushToken,
} from "../../services/userService";
import {
  sendPushNotification,
  createNotification,
} from "../../services/notificationService";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { format } from "date-fns";
import { ReportFoodModal } from "../../components/ReportFoodModal"; // 1. Import the new modal

export const DashboardScreen = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dispatchedSubs, setDispatchedSubs] = useState<Set<string>>(new Set());

  // 2. Add state for the Report Food modal
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  const todayDateFormatted = format(new Date(), "EEEE, MMM d");

  // --- Function to fetch today's deliveries ---
  const fetchDeliveries = useCallback(
    async (isRefresh = false) => {
      if (!user) {
        /* ... */ return;
      }
      if (!isRefresh) setLoading(true);
      setError(null);
      const { deliveries: fetchedDeliveries, error: fetchError } =
        await getTodaysDeliveries(user.uid);
      if (fetchError) {
        setError(fetchError);
      } else if (fetchedDeliveries) {
        setDeliveries(fetchedDeliveries);
      }
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    },
    [user]
  );

  // --- Fetch data when the screen comes into focus ---
  useFocusEffect(
    useCallback(() => {
      fetchDeliveries();
      setDispatchedSubs(new Set());
    }, [fetchDeliveries])
  );

  // --- Handle Pull-to-Refresh ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setDispatchedSubs(new Set());
    fetchDeliveries(true);
  }, [fetchDeliveries]);

  // --- Handle Dispatch Button Press ---
  const handleDispatch = async (deliveryItem: DailyDelivery) => {
    if (dispatchedSubs.has(deliveryItem.subscriptionId)) return;
    setDispatchedSubs(new Set(dispatchedSubs).add(deliveryItem.subscriptionId));
    console.log(
      `[Notifications] Dispatching tiffin for user: ${deliveryItem.userId}`
    );
    const title = "Your Tiffin is on its way! 🛵";
    const body = `Your ${deliveryItem.planName} (${deliveryItem.mealType}) has been dispatched.`;
    const pushToken = await getUserPushToken(deliveryItem.userId);
    if (pushToken) {
      await sendPushNotification(pushToken, title, body);
    } else {
      console.log(
        `[Notifications] Customer ${deliveryItem.customerName} does not have a push token.`
      );
    }
    await createNotification(deliveryItem.userId, title, body);
    Alert.alert(
      "Dispatched!",
      `Customer ${deliveryItem.customerName} has been notified.`
    );
  };

  // --- Render Item for FlatList ---
  const renderDeliveryItem = ({ item }: { item: DailyDelivery }) => {
    const isDispatched = dispatchedSubs.has(item.subscriptionId);
    return (
      <Card style={[styles.card, isDispatched && styles.cardDispatched]}>
        <Card.Content>
          {/* ... (Existing Card Header: Name, Meal Tag) ... */}
          <View style={styles.cardHeader}>
            <Icon
              name="account-circle-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text variant="titleMedium" style={styles.customerName}>
              {item.customerName}
            </Text>
            <View
              style={[
                styles.mealTag,
                {
                  backgroundColor:
                    item.mealType === "Lunch"
                      ? theme.colors.secondaryContainer
                      : theme.colors.tertiaryContainer,
                },
              ]}
            >
              <Icon
                name={
                  item.mealType === "Lunch" ? "weather-sunny" : "weather-night"
                }
                size={14}
                color={
                  item.mealType === "Lunch"
                    ? theme.colors.onSecondaryContainer
                    : theme.colors.onTertiaryContainer
                }
              />
              <Text
                style={[
                  styles.mealTagText,
                  {
                    color:
                      item.mealType === "Lunch"
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onTertiaryContainer,
                  },
                ]}
              >
                {item.mealType}
              </Text>
            </View>
          </View>
          <Divider style={styles.divider} />
          {/* ... (Existing Card Details: Address, Plan) ... */}
          <View style={styles.detailRow}>
            <Icon
              name="map-marker-radius-outline"
              size={18}
              color={theme.colors.outline}
              style={styles.detailIcon}
            />
            <Text style={styles.addressText} selectable>
              {item.customerAddress}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon
              name="food-variant"
              size={18}
              color={theme.colors.outline}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>{item.planName}</Text>
          </View>
          {/* Dispatch Button */}
          <Button
            mode={isDispatched ? "outlined" : "contained-tonal"}
            icon={isDispatched ? "check-all" : "send-check-outline"}
            style={styles.dispatchButton}
            onPress={() => handleDispatch(item)}
            disabled={isDispatched}
          >
            {isDispatched ? "Dispatched" : "Dispatch"}
          </Button>
        </Card.Content>
      </Card>
    );
  };

  // --- Render different states ---
  if (loading && !refreshing) {
    return (
      <ActivityIndicator animating={true} style={styles.loader} size="large" />
    );
  }
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={onRefresh} mode="outlined" style={{ marginTop: 15 }}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={deliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.subscriptionId}
        style={styles.container}
        contentContainerStyle={
          deliveries.length === 0 ? styles.centerContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text variant="headlineSmall" style={styles.listHeader}>
              Today's Deliveries ({deliveries.length})
            </Text>
            <Text variant="bodyMedium" style={styles.dateHeader}>
              {todayDateFormatted}
            </Text>
            {/* --- 3. Add Report Food Button --- */}
            <Button
              mode="contained"
              icon="food-off-outline"
              style={styles.reportButton}
              labelStyle={{ color: "white" }} // Make text white
              buttonColor={theme.colors.error} // Use a distinct color (e.g., red)
              onPress={() => setIsReportModalVisible(true)}
            >
              Report Leftover Food
            </Button>
            {/* ------------------------------- */}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.centerContainer}>
              <Icon
                name="calendar-check-outline"
                size={48}
                color={theme.colors.backdrop}
              />
              <Text style={styles.emptyText}>
                No deliveries scheduled for today!
              </Text>
              <Text style={styles.emptySubText}>(Pull down to refresh)</Text>
            </View>
          ) : null
        }
      />

      {/* --- 4. Render the Report Food Modal --- */}
      <ReportFoodModal
        visible={isReportModalVisible}
        onDismiss={() => setIsReportModalVisible(false)}
      />
    </>
  );
};

// --- STYLES (Add reportButton) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centerContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: {
    textAlign: "center",
    color: "red",
    fontSize: 16,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 18,
    color: "gray",
  },
  emptySubText: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    color: "darkgray",
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  listHeader: { fontWeight: "bold" },
  dateHeader: { color: "gray", marginBottom: 16 }, // Add margin
  reportButton: {
    // Style for the new button
    borderRadius: 8,
  },
  listContent: { paddingBottom: 16 },
  card: { marginHorizontal: 12, marginTop: 12, elevation: 2, borderRadius: 8 },
  cardDispatched: { backgroundColor: "#fafafa", opacity: 0.7 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  customerName: { marginLeft: 10, fontWeight: "600", fontSize: 17, flex: 1 },
  mealTag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginLeft: "auto",
  },
  mealTagText: { marginLeft: 4, fontSize: 12, fontWeight: "500" },
  divider: { marginVertical: 10, height: 1, backgroundColor: "#eee" },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailIcon: { marginRight: 10, marginTop: 3, color: "#555" },
  addressText: { flex: 1, fontSize: 14, color: "#333", lineHeight: 21 },
  detailText: { flex: 1, fontSize: 14, color: "#555", marginTop: 2 },
  dispatchButton: { marginTop: 12, alignSelf: "flex-end" },
});
