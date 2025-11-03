// src/screens/customer/PaymentHistoryScreen.tsx
import React, { useState, useCallback } from "react";
// --- FIX: Changed 'in' to 'from' ---
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
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

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return `₹${amount.toFixed(2)}`;
};

// --- Detail Modal Component ---
export const SubscriptionDetailModal = ({
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
// --- END MODAL ---

export const PaymentHistoryScreen = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // State for Modal
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

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

  // --- Modal Handlers ---
  const handleItemPress = (subscription: Subscription) => {
    setSelectedSub(subscription);
    setIsModalVisible(true);
  };
  const handleDismissModal = () => {
    setIsModalVisible(false);
    setSelectedSub(null);
  };

  // --- Render Item for FlatList ---
  // --- FIX: Explicitly type 'item' ---
  const renderHistoryItem = ({ item }: { item: Subscription }) => {
    const price = item.pricePaid || 0;
    const createdAtDate = item.createdAt ? item.createdAt.toDate() : new Date();

    let statusIcon = "check-circle";
    let statusColor = theme.colors.primary; // 'active'
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
        onPress={() => handleItemPress(item)} // Make item clickable
        left={(props) => (
          <List.Icon {...props} icon={statusIcon} color={statusColor} />
        )}
        right={() => (
          <View style={styles.priceContainer}>
            <Text style={styles.totalPriceText}>{formatCurrency(price)}</Text>
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
        renderItem={renderHistoryItem} // This is now correctly typed
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
      {/* Render the Modal */}
      <SubscriptionDetailModal
        visible={isModalVisible}
        onDismiss={handleDismissModal}
        subscription={selectedSub}
      />
    </>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    textAlign: "center",
    color: "red",
    fontSize: 16,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "gray",
    marginTop: 16,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    fontWeight: "bold",
    color: "#333",
  },
  listContent: { paddingHorizontal: 8, paddingBottom: 8 },
  listItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  itemTitle: { fontWeight: "bold" },
  itemDate: { fontSize: 12, color: "gray" },
  priceContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 16,
  },
  totalPriceText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  // Modal Styles
  modalContainer: {
    backgroundColor: "white",
    padding: 22,
    margin: 20,
    borderRadius: 8,
    maxHeight: "80%",
  },
  modalTitle: { marginBottom: 4, textAlign: "center", fontWeight: "bold" },
  modalSubtitle: {
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
    color: "gray",
  },
  divider: { marginVertical: 12 },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalDetailLabel: { fontSize: 15, color: "#555", fontWeight: "600" },
  modalDetailValue: {
    fontSize: 15,
    color: "#333",
    textAlign: "right",
    flexShrink: 1,
  },
  modalButton: { marginTop: 20 },
});
