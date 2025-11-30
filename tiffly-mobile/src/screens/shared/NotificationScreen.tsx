// src/screens/shared/NotificationScreen.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, SectionList, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, List, Divider, useTheme, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { getUserNotifications, Notification, markNotificationsAsRead } from '../../services/userService';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Type for the sections in our SectionList
type NotificationSection = {
  title: string;
  data: Notification[];
};

export const NotificationScreen = () => {
  const { user } = useAuth();
  const theme = useTheme(); // Get theme
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- 1. MOVE STYLES INSIDE the component ---
const styles = useMemo(
  () =>
    StyleSheet.create({
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
        backgroundColor: "#fafafa",
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

      listContent: {
        paddingBottom: 8,
      },

      /* SECTION HEADER */
      sectionHeader: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        fontSize: 14,
        fontWeight: "700",
        color: "#e53935",
        backgroundColor: "#fdf1f1",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#f1c9c8",
      },

      /* NOTIFICATION ITEM */
      listItem: {
        backgroundColor: "#ffffff",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
      },

      listItemUnread: {
        backgroundColor: "#fff7f7",
      },

      itemTitle: {
        fontSize: 15,
        color: "#222",
      },
      itemUnread: {
        fontWeight: "700",
        color: "#b71c1c",
      },

      itemBody: {
        fontSize: 13,
        color: "#666",
        marginTop: 2,
      },

      itemDate: {
        fontSize: 12,
        color: "#999",
        alignSelf: "center",
        paddingRight: 10,
      },
    }),
  [theme]
);



  // --- Data Fetching ---
  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!user) { setLoading(false); setError("Not logged in."); if (isRefresh) setRefreshing(false); return; }
    if (!isRefresh) setLoading(true);
    setError(null);
    const { notifications: fetchedNotifications, error: fetchError } =
      await getUserNotifications(user.uid);
    if (fetchError) { setError(fetchError); setNotifications([]); }
    else { setNotifications(fetchedNotifications || []); }
    setLoading(false);
    if (isRefresh) setRefreshing(false);
  }, [user]);

  // --- Mark as Read on Focus ---
  useFocusEffect(
    useCallback(() => {
      fetchNotifications(); 
      if (user) {
        markNotificationsAsRead(user.uid);
      }
    }, [user, fetchNotifications])
  );

  // --- Handle pull-to-refresh ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(true);
  }, [fetchNotifications]);

  // --- Process Notifications into Sections ---
  const notificationSections = useMemo(() => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const earlier: Notification[] = [];
    notifications.forEach(notif => {
      const date = notif.createdAt.toDate();
      if (isToday(date)) { today.push(notif); }
      else if (isYesterday(date)) { yesterday.push(notif); }
      else { earlier.push(notif); }
    });
    const sections: NotificationSection[] = [];
    if (today.length > 0) { sections.push({ title: 'Today', data: today }); }
    if (yesterday.length > 0) { sections.push({ title: 'Yesterday', data: yesterday }); }
    if (earlier.length > 0) { sections.push({ title: 'Earlier', data: earlier }); }
    return sections;
  }, [notifications]);

  // --- Render Item for SectionList ---
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const timeAgo = item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'Just now';
    return (
      <List.Item
        title={item.title}
        description={item.body}
        descriptionNumberOfLines={2}
        titleStyle={[styles.itemTitle, !item.isRead && styles.itemUnread]}
        descriptionStyle={styles.itemBody}
        left={props => (
             <List.Icon {...props}
                icon={!item.isRead ? "bell-ring" : "bell-check-outline"} 
                color={!item.isRead ? theme.colors.primary : theme.colors.onSurfaceDisabled}
             />
        )}
        right={() => (<Text style={styles.itemDate}>{timeAgo}</Text>)}
        style={[styles.listItem, !item.isRead && styles.listItemUnread]}
      />
    );
  };

  // --- Render Header for each Section ---
  const renderSectionHeader = ({ section: { title } }: { section: NotificationSection }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  if (loading && !refreshing) {
    return <ActivityIndicator animating={true} style={styles.loader} size="large" />;
  }

  if (error) {
    return (
        <View style={styles.centerContainer}>
            <Text style={styles.errorText} selectable>{error}</Text>
             {error.includes('index') && (
                <Text style={styles.emptyText}>Please create the required database index.</Text>
            )}
            <Button onPress={onRefresh} mode="outlined" style={{marginTop: 15}}>Retry</Button>
        </View>
    );
  }

  // --- Render SectionList ---
  return (
    <SectionList
      style={styles.container}
      sections={notificationSections}
      renderItem={renderNotificationItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={(item) => item.id}
      contentContainerStyle={notificationSections.length === 0 ? styles.centerContainer : styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={!loading ? (
          <View style={styles.centerContainer}>
            <Icon name="bell-off-outline" size={48} color={theme.colors.backdrop} />
            <Text style={styles.emptyText}>You have no notifications.</Text>
          </View>
      ) : null}
      ItemSeparatorComponent={() => <Divider />}
      stickySectionHeadersEnabled={true}
    />
  );
};