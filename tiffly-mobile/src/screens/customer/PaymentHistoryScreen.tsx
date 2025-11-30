// src/screens/customer/PaymentHistoryScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
  Alert,
} from "react-native";
import {
  Text,
  ActivityIndicator,
  List,
  Divider,
  Card,
  useTheme,
  Button,
  Portal,
  Modal,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import {
  getCustomerSubscriptions,
  Subscription,
} from "../../services/userService";
import { format } from "date-fns";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { RatingModal } from "../../components/RatingModal"; // 1. Import RatingModal
import { API_BASE_URL } from "../../config/api"; // 2. Import API URL for backend call

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return `₹${amount.toFixed(2)}`;
};

// --- Detail Modal Component (Same as before) ---
const SubscriptionDetailModal = ({
  visible,
  onDismiss,
  subscription,
}: {
  visible: boolean;
  onDismiss: () => void;
  subscription: Subscription | null;
}) => {
  if (!subscription) return null;

  const startDate = subscription.startDate.toDate();
  const endDate = subscription.endDate.toDate();
  const price = subscription.pricePaid || 0;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <ScrollView>
          <Text variant="headlineSmall" style={styles.modalTitle}>
            {subscription.planName}
          </Text>
          <Text style={styles.modalSubtitle}>
            From: {subscription.kitchenName || "N/A"}
          </Text>

          <Divider style={styles.divider} />

          <View style={styles.modalDetailRow}>
            <Text style={styles.modalDetailLabel}>Status:</Text>
            <Text
              style={[
                styles.modalDetailValue,
                {
                  color: subscription.status === "active" ? "green" : "gray",
                  textTransform: "capitalize",
                },
              ]}
            >
              {subscription.status}
            </Text>
          </View>
          <View style={styles.modalDetailRow}>
            <Text style={styles.modalDetailLabel}>Amount Paid:</Text>
            <Text style={styles.modalDetailValue}>{formatCurrency(price)}</Text>
          </View>
          <View style={styles.modalDetailRow}>
            <Text style={styles.modalDetailLabel}>Plan:</Text>
            <Text style={styles.modalDetailValue}>
              {subscription.planFrequency}
            </Text>
          </View>
          <View style={styles.modalDetailRow}>
            <Text style={styles.modalDetailLabel}>Start Date:</Text>
            <Text style={styles.modalDetailValue}>
              {format(startDate, "MMM d, yyyy")}
            </Text>
          </View>
          <View style={styles.modalDetailRow}>
            <Text style={styles.modalDetailLabel}>End/Renewal Date:</Text>
            <Text style={styles.modalDetailValue}>
              {format(endDate, "MMM d, yyyy")}
            </Text>
          </View>
          {subscription.pausedUntil && (
            <View style={styles.modalDetailRow}>
              <Text style={styles.modalDetailLabel}>Paused Until:</Text>
              <Text style={styles.modalDetailValue}>
                {format(subscription.pausedUntil.toDate(), "MMM d, yyyy")}
              </Text>
            </View>
          )}

          <Button onPress={onDismiss} style={styles.modalButton}>
            Close
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
};
// --- END DETAIL MODAL ---

export const PaymentHistoryScreen = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // State for Detail Modal
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  // --- 3. State for Rating Modal ---
  const [ratingSub, setRatingSub] = useState<Subscription | null>(null);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  // -------------------------------

  // --- Data Fetching ---
  const fetchHistory = useCallback(
    async (isRefresh = false) => {
      if (!user) {
        setError("Not logged in.");
        setLoading(false);
        if (isRefresh) setRefreshing(false);
        return;
      }
      if (!isRefresh) setLoading(true);
      setError(null);

      const { subscriptions: fetchedSubscriptions, error: fetchError } =
        await getCustomerSubscriptions(user.uid);

      if (fetchError) {
        setError(fetchError);
        setSubscriptions([]);
      } else {
        setSubscriptions(fetchedSubscriptions || []);
      }
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    },
    [user]
  );

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory(true);
  }, [fetchHistory]);

  // --- Detail Modal Handlers ---
  const handleItemPress = (subscription: Subscription) => {
    setSelectedSub(subscription);
    setIsDetailModalVisible(true);
  };
  const handleDismissDetailModal = () => {
    setIsDetailModalVisible(false);
    setSelectedSub(null);
  };

  // --- 4. Rating Modal Handlers ---
  const handleRatePress = (subscription: Subscription) => {
    setRatingSub(subscription);
    setIsRatingModalVisible(true);
  };

  const handleDismissRatingModal = () => {
    setIsRatingModalVisible(false);
    setRatingSub(null);
  };

  const handleSubmitRating = async (rating: number, review: string) => {
    if (!user || !ratingSub) return;

    console.log(
      `Submitting review for provider ${ratingSub.providerId}: ${rating} stars`
    );

    try {
      const response = await fetch(`${API_BASE_URL}/submit-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: ratingSub.providerId,
          userId: user.uid,
          rating: rating,
          reviewText: review,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      Alert.alert("Success", "Thank you for your feedback!");
      // Ideally, we'd mark this subscription as "rated" locally to hide the button,
      // but for now, we'll just close the modal.
    } catch (err: any) {
      console.error("Error submitting review:", err);
      Alert.alert("Error", err.message || "Could not submit review.");
    }
  };
  // -------------------------------

  // --- Render Item for FlatList ---
  const renderHistoryItem = ({ item }: { item: Subscription }) => {
    const price = item.pricePaid || 0;
    const createdAtDate = item.createdAt ? item.createdAt.toDate() : new Date();

    let statusIcon = "check-circle";
    let statusColor = theme.colors.primary;
    if (item.status === "paused") {
      statusIcon = "pause-circle";
      statusColor = theme.colors.onSurfaceDisabled;
    } else if (item.status === "trialing") {
      statusIcon = "clock-start";
      statusColor = theme.colors.secondary;
    } else if (item.status === "cancelled") {
      statusIcon = "cancel";
      statusColor = theme.colors.error;
    }

    return (
      <List.Item
        title={item.planName}
        description={`${item.kitchenName || "N/A"}\nPurchased on ${format(
          createdAtDate,
          "MMM d, yyyy"
        )}`}
        titleStyle={styles.itemTitle}
        descriptionStyle={styles.itemDate}
        descriptionNumberOfLines={2}
        onPress={() => handleItemPress(item)}
        left={(props) => (
          <List.Icon {...props} icon={statusIcon} color={statusColor} />
        )}
        right={() => (
          <View style={styles.rightContainer}>
            <Text style={styles.totalPriceText}>{formatCurrency(price)}</Text>
            {/* 5. Add Rate Button */}
            <Button
              mode="text"
              compact
              onPress={() => handleRatePress(item)}
              textColor={theme.colors.secondary}
            >
              Rate
            </Button>
          </View>
        )}
        style={styles.listItem}
      />
    );
  };

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
        style={styles.container}
        data={subscriptions}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          subscriptions.length === 0
            ? styles.centerContainer
            : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <Text variant="headlineSmall" style={styles.listHeader}>
            Payment History
          </Text>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.centerContainer}>
              <Icon name="history" size={48} color={theme.colors.backdrop} />
              <Text style={styles.emptyText}>No payment history found.</Text>
            </View>
          ) : null
        }
      />

      {/* Detail Modal */}
      <SubscriptionDetailModal
        visible={isDetailModalVisible}
        onDismiss={handleDismissDetailModal}
        subscription={selectedSub}
      />

      {/* 6. Rating Modal */}
      <RatingModal
        visible={isRatingModalVisible}
        onDismiss={handleDismissRatingModal}
        onSubmit={handleSubmitRating}
        providerName={ratingSub?.kitchenName || "Provider"}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },

  centerContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  errorText: {
    textAlign: "center",
    color: "#e53935",
    fontSize: 15,
    marginBottom: 10,
    fontWeight: "600",
  },

  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },

  /* HEADER */
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    fontWeight: "700",
    fontSize: 20,
    color: "#e53935",
  },

  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },

  /* LIST ITEM CARD */
  listItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },

  itemTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#222",
  },

  itemDate: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  /* RIGHT SIDE PRICE + RATE BUTTON */
  rightContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 8,
    gap: 4,
  },

  totalPriceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e53935",
  },

  /* MODAL */
  modalContainer: {
    backgroundColor: "white",
    padding: 22,
    margin: 20,
    borderRadius: 12,
    maxHeight: "80%",
    elevation: 3,
  },

  modalTitle: {
    marginBottom: 4,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 20,
    color: "#e53935",
  },

  modalSubtitle: {
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
    color: "#999",
  },

  divider: {
    marginVertical: 12,
    height: 1.3,
    backgroundColor: "#eee",
  },

  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  modalDetailLabel: {
    fontSize: 15,
    color: "#444",
    fontWeight: "600",
  },

  modalDetailValue: {
    fontSize: 15,
    color: "#222",
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
  },

  modalButton: {
    marginTop: 20,
    borderRadius: 8,
  },
});
