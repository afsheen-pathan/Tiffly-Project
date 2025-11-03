// src/screens/shared/NotificationScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, List, Divider, useTheme, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { getUserNotifications, Notification, markNotificationsAsRead } from '../../services/userService';
import { formatDistanceToNow } from 'date-fns'; // Use for relative time
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const NotificationScreen = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- Data Fetching ---
  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!user) {
      setError("Not logged in.");
      setLoading(false);
      if (isRefresh) setRefreshing(false);
      return;
    }
    if (!isRefresh) setLoading(true);
    setError(null);
    
    const { notifications: fetchedNotifications, error: fetchError } =
      await getUserNotifications(user.uid);

    if (fetchError) {
      setError(fetchError);
      setNotifications([]);
    } else {
      setNotifications(fetchedNotifications || []);
    }
    setLoading(false);
    if (isRefresh) setRefreshing(false);
  }, [user]);

  // --- Mark as Read on Focus ---
  useFocusEffect(
    useCallback(() => {
      // Fetch notifications when screen is focused
      fetchNotifications(); 
      
      // ALSO, mark notifications as read
      if (user) {
        console.log("[Notifications] Marking all as read...");
        markNotificationsAsRead(user.uid);
      }
    }, [user, fetchNotifications]) // Add user and fetchNotifications
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(true);
  }, [fetchNotifications]);

  // --- Render Item for FlatList ---
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const timeAgo = item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'Just now';
    
    return (
      <List.Item
        title={item.title}
        description={item.body}
        descriptionNumberOfLines={2} // Allow body to wrap
        titleStyle={[styles.itemTitle, !item.isRead && styles.itemUnread]}
        descriptionStyle={styles.itemBody}
        left={props => (
             <List.Icon {...props}
                // Show 'bell-ring' for unread, 'bell-check' for read
                icon={!item.isRead ? "bell-ring" : "bell-check-outline"} 
                color={!item.isRead ? theme.colors.primary : theme.colors.onSurfaceDisabled}
             />
        )}
        right={() => (
          <Text style={styles.itemDate}>{timeAgo}</Text>
        )}
        style={[styles.listItem, !item.isRead && styles.listItemUnread]}
        // We can add onPress to mark a single item as read later if needed
        // onPress={() => console.log('Mark one as read...')}
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
    <FlatList
      style={styles.container}
      data={notifications}
      renderItem={renderNotificationItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={notifications.length === 0 ? styles.centerContainer : styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
         <Text variant='headlineSmall' style={styles.listHeader}>Notifications</Text>
      }
      ListEmptyComponent={!loading ? (
          <View style={styles.centerContainer}>
            <Icon name="bell-off-outline" size={48} color={theme.colors.backdrop} />
            <Text style={styles.emptyText}>You have no notifications.</Text>
          </View>
      ) : null}
      ItemSeparatorComponent={() => <Divider />} // Add separators
    />
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
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
    marginTop: 16,
  },
  listHeader: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 10,
      fontWeight: 'bold',
      color: '#333',
      backgroundColor: '#f5f5f5',
  },
  listContent: {
    paddingBottom: 8,
  },
  listItem: {
      backgroundColor: '#fff',
      paddingVertical: 8,
  },
  listItemUnread: {
      backgroundColor: '#E8EAF6', // Light indigo for unread
  },
  itemTitle: {
      fontWeight: 'normal',
      fontSize: 16,
  },
  itemUnread: {
      fontWeight: 'bold', // Make unread titles bold
  },
  itemBody: {
      fontSize: 14,
      color: 'gray',
  },
  itemDate: {
      fontSize: 12,
      color: 'gray',
      alignSelf: 'center',
      paddingRight: 8,
  },
});