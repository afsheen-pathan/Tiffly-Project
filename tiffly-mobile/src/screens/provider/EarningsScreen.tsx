// src/screens/provider/EarningsScreen.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
// 1. Import Portal and Modal
import { Text, ActivityIndicator, List, Divider, Card, useTheme, Button, Portal, Modal } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { getProviderSubscriptions, Subscription } from '../../services/userService';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// 2. Import the modal component we created for customers (we can reuse it)
import { ProviderEarningsModal } from '../../components/ProviderEarningsModal';
// Helper function to format currency
const formatCurrency = (amount: number) => {
  return `₹${amount.toFixed(2)}`;
};

export const EarningsScreen = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- 3. Add State for Modal ---
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  // -----------------------------

  // --- Data Fetching ---
  const fetchSubscriptions = useCallback(async (isRefresh = false) => {
    if (!user) {
      setError("Not logged in.");
      setLoading(false);
      if (isRefresh) setRefreshing(false);
      return;
    }
    if (!isRefresh) setLoading(true);
    setError(null);
    
    const { subscriptions: fetchedSubscriptions, error: fetchError } =
      await getProviderSubscriptions(user.uid);

    if (fetchError) {
      setError(fetchError);
      setSubscriptions([]);
    } else {
      // Ensure we have an array
      setSubscriptions(fetchedSubscriptions || []);
    }
    setLoading(false);
    if (isRefresh) setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchSubscriptions();
    }, [fetchSubscriptions])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSubscriptions(true);
  }, [fetchSubscriptions]);

  // --- Calculate Totals using useMemo ---
  const { totalRevenue, totalEarnings, activeSubscriptions } = useMemo(() => {
    let revenue = 0;
    let earnings = 0;
    let active = 0;

    // Ensure subscriptions is an array before iterating
    if (Array.isArray(subscriptions)) {
      subscriptions.forEach(sub => {
        if (sub.status === 'active' || sub.status === 'paused') {
          const price = sub.pricePaid || 0;
          revenue += price;
          earnings += price * 0.90; // Calculate 90%
          if (sub.status === 'active') {
              active++;
          }
        }
      });
    }

    return {
      totalRevenue: revenue,
      totalEarnings: earnings,
      activeSubscriptions: active,
    };
  }, [subscriptions]); // Recalculate only when subscriptions change

  // --- 4. Add Modal Handlers ---
  const handleItemPress = (subscription: Subscription) => {
    setSelectedSub(subscription);
    setIsModalVisible(true);
  };
  const handleDismissModal = () => {
    setIsModalVisible(false);
    setSelectedSub(null);
  };
  // ---------------------------

  // --- Render Item for FlatList ---
  const renderTransactionItem = ({ item }: { item: Subscription }) => {
    const price = item.pricePaid || 0;
    const earning = price * 0.90;
    const createdAtDate = item.createdAt ? item.createdAt.toDate() : new Date();

    return (
      <List.Item
        title={item.planName}
        // 5. Add Customer's User ID (or name if we fetched it)
        description={`Customer: ${item.userId.substring(0, 8)}...\nSubscribed on ${format(createdAtDate, 'MMM d, yyyy')}`}
        titleStyle={styles.itemTitle}
        descriptionStyle={styles.itemDate}
        descriptionNumberOfLines={2}
        onPress={() => handleItemPress(item)} // --- 6. MAKE ITEM CLICKABLE ---
        left={props => (
             <List.Icon {...props}
                icon={item.status === 'active' ? 'check-circle' : 'pause-circle'}
                color={item.status === 'active' ? theme.colors.primary : theme.colors.onSurfaceDisabled}
             />
        )}
        right={() => (
          <View style={styles.priceContainer}>
            <Text style={styles.earningText}>{formatCurrency(earning)}</Text>
            <Text style={styles.totalPriceText}>(Total: {formatCurrency(price)})</Text>
          </View>
        )}
        style={styles.listItem}
      />
    );
  };


  if (loading && !refreshing) {
    return <ActivityIndicator animating={true} style={styles.loader} size="large" />;
  }

  if (error) {
    return (
        <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button onPress={onRefresh} mode="outlined" style={{marginTop: 15}}>Retry</Button>
        </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {/* --- Summary Cards --- */}
        <Card style={styles.summaryCard}>
            <Card.Content>
                <Text style={styles.summaryTitle}>Total Earnings (90%)</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(totalEarnings)}</Text>
                <Text style={styles.summarySubtitle}>Based on {subscriptions.length} total transactions</Text>
            </Card.Content>
        </Card>
        <Card style={styles.summaryCardSecondary}>
             <Card.Content>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Revenue (100%)</Text>
                    <Text style={styles.detailValue}>{formatCurrency(totalRevenue)}</Text>
                </View>
                 <Divider style={styles.divider} />
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Active Subscriptions</Text>
                    <Text style={styles.detailValue}>{activeSubscriptions}</Text>
                </View>
             </Card.Content>
        </Card>

        {/* --- Transaction List --- */}
        <Text variant='titleLarge' style={styles.listHeader}>Transaction History</Text>
        <FlatList
          data={subscriptions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={subscriptions.length === 0 ? styles.centerContainer : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={!loading ? (
             <View style={styles.centerContainer}>
                <Icon name="history" size={48} color={theme.colors.backdrop} />
                <Text style={styles.emptyText}>No subscription transactions found yet.</Text>
             </View>
          ) : null}
        />
      </View>

      {/* --- 7. Render the Modal --- */}
      {/* We reuse the same modal from the customer side */}
      <ProviderEarningsModal
        visible={isModalVisible}
        onDismiss={handleDismissModal}
        subscription={selectedSub}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  /* ---------- LOADER & EMPTY ---------- */
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#777",
    marginTop: 10,
  },

  /* ---------- SUMMARY CARDS ---------- */
  summaryCard: {
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: "#ffeaea", // very light red theme tint
    elevation: 2,

    shadowColor: "#e53935",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  summaryCardSecondary: {
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    elevation: 2,

    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },

  summaryTitle: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    fontWeight: "600",
  },

  summaryAmount: {
    fontSize: 34,
    fontWeight: "800",
    color: "#e53935", // theme primary
    textAlign: "center",
    marginVertical: 6,
  },

  summarySubtitle: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginBottom: 4,
  },

  /* ---------- DETAIL ROWS ---------- */
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  divider: {
    marginVertical: 8,
    height: 1,
    backgroundColor: "#eee",
  },

  /* ---------- LIST HEADER ---------- */
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 10,
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },

  /* ---------- TRANSACTION LIST ---------- */
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 14,
    flexGrow: 1,
  },

  listItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },

  itemTitle: {
    fontWeight: "700",
    color: "#222",
  },

  itemDate: {
    fontSize: 13,
    color: "#777",
  },

  /* ---------- PRICE BADGES ---------- */
  priceContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 8,
  },

  earningText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e53935", // theme primary
  },

  totalPriceText: {
    fontSize: 11,
    color: "#888",
  },
});
