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

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'gray',
  },
  summaryCard: {
      marginHorizontal: 12,
      marginTop: 16,
      backgroundColor: '#E8EAF6', // Light indigo background
      elevation: 2,
  },
  summaryCardSecondary: {
      marginHorizontal: 12,
      marginTop: 12,
      backgroundColor: '#fff',
      elevation: 1,
  },
  summaryTitle: {
      fontSize: 16,
      color: '#555',
      textAlign: 'center',
  },
  summaryAmount: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#303F9F', // Dark indigo
      textAlign: 'center',
      marginVertical: 4,
  },
  summarySubtitle: {
      fontSize: 12,
      color: '#555',
      textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: 'gray',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  divider: {
      marginVertical: 6,
  },
  listHeader: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 8,
      fontWeight: 'bold',
      color: '#333',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    flexGrow: 1, // Ensure empty list component centers
  },
  listItem: {
      backgroundColor: '#fff',
      borderRadius: 8,
      marginBottom: 8,
      elevation: 1,
  },
  itemTitle: {
      fontWeight: 'bold',
  },
  itemDate: {
      fontSize: 12,
      color: 'gray',
  },
  priceContainer: {
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingRight: 8,
  },
  earningText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'green',
  },
  totalPriceText: {
      fontSize: 11,
      color: 'gray',
  }
});