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
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
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
                    item.mealType === "Lunch" ? "#FFE8D9" : "#E0F2FF",
                },
              ]}
            >
              <Icon
                name={
                  item.mealType === "Lunch"
                    ? "silverware-fork-knife"
                    : "moon-waning-crescent"
                }
                size={16}
                color={item.mealType === "Lunch" ? "#e53935" : "#0277BD"}
                style={{ marginRight: 4 }}
              />

              <Text
                style={[
                  styles.mealTagText,
                  { color: item.mealType === "Lunch" ? "#e53935" : "#0277BD" },
                ]}
              >
                {item.mealType}
              </Text>
            </View>
          </View>
          <Divider style={styles.divider} />
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
          <Button
            mode={isDispatched ? "outlined" : "contained"}
            buttonColor={isDispatched ? undefined : "#e53935"}
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
            <Button
              mode="contained"
              icon="food-off-outline"
              style={styles.reportButton}
              labelStyle={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 15,
                letterSpacing: 0.5,
              }}
              buttonColor="#e53935"
              onPress={() => setIsReportModalVisible(true)}
            >
              Report Leftover Food
            </Button>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
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
    color: "#D32F2F",
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "600",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 18,
    color: "#666",
    fontWeight: "600",
  },

  emptySubText: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 14,
    color: "#999",
  },

  // HEADER
  headerContainer: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },

  listHeader: {
    fontWeight: "800",
    fontSize: 22,
    color: "#222",
    letterSpacing: 0.3,
  },

  dateHeader: {
    color: "#777",
    marginTop: 3,
    marginBottom: 14,
    fontSize: 14,
  },

  reportButton: {
    borderRadius: 12,
    paddingVertical: 5,
  },

  listContent: {
    paddingBottom: 20,
  },

  // CARD
  card: {
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "#FFF",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,

    paddingBottom: 10,
  },

  cardDispatched: {
    backgroundColor: "#F3F3F3",
    opacity: 0.85,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  customerName: {
    marginLeft: 10,
    fontWeight: "700",
    fontSize: 17,
    color: "#1A1A1A",
    flex: 1,
  },

  // Meal type tag
  mealTag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 10,

    backgroundColor: "#FFEBE0", // Soft orange background (premium)
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  mealTagText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "700",
    color: "#e53935", // Orange text
  },

  divider: {
    marginVertical: 12,
    height: 1,
    backgroundColor: "#EDEDED",
  },

  // DETAILS
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  detailIcon: {
    marginRight: 10,
    marginTop: 3,
    color: "#555",
  },

  addressText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 21,
  },

  detailText: {
    flex: 1,
    fontSize: 14,
    color: "#444",
    marginTop: 2,
  },

  // DISPATCH BUTTON
  dispatchButton: {
    marginTop: 12,
    alignSelf: "flex-end",
    borderRadius: 10,
    backgroundColor: "#e53935", 
    paddingVertical: 4,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
});
