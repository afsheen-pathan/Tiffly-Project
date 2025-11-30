// src/screens/customer/SubscriptionScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { Text, Card, ActivityIndicator, Button, Divider, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { getUserActiveSubscriptions, Subscription, updateSubscriptionStatus } from '../../services/userService';
import { scheduleLocalNotification } from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, differenceInDays, subDays, differenceInCalendarDays } from 'date-fns';
import { DatePickerModal } from 'react-native-paper-dates';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const REMINDER_STORAGE_KEY_PREFIX = '@subscription_reminder_sent_';

// --- Reusable Card Component for each subscription ---
const SubscriptionCard = ({
  subscription,
  onPausePress,
  onResumePress,
}: {
  subscription: Subscription;
  onPausePress: (sub: Subscription) => void;
  onResumePress: (sub: Subscription) => void;
}) => {
  const theme = useTheme();
  const startDate = subscription.startDate.toDate();
  const endDate = subscription.endDate.toDate();
  const pausedUntilDate = subscription.pausedUntil?.toDate();

  return (
    <Card style={styles.card}>
      <Card.Title
          title={subscription.planName}
          titleVariant="headlineSmall"
          subtitle={subscription.status === 'paused' && pausedUntilDate ? `Paused until ${format(pausedUntilDate, 'MMM d, yyyy')}` : 'Active'}
          subtitleStyle={subscription.status === 'paused' ? styles.statusPaused : styles.statusActive}
      />
      <Card.Content>
        <Text style={styles.kitchenName}>From: {subscription.kitchenName || 'Loading...'}</Text>
        <Divider style={styles.divider} />
        <View style={styles.detailRow}>
<MaterialCommunityIcons name="calendar-arrow-right" size={20} color={theme.colors.primary} />
          <Text style={styles.detailLabel}>Started On:</Text>
          <Text style={styles.detailValue}>{format(startDate, 'MMM d, yyyy')}</Text>
        </View>
        <View style={styles.detailRow}>
<MaterialCommunityIcons name="calendar-arrow-left" size={20} color={theme.colors.error} />
          <Text style={styles.detailLabel}>Next Renewal:</Text>
          <Text style={styles.detailValue}>{format(endDate, 'MMM d, yyyy')}</Text>
        </View>
         <View style={styles.detailRow}>
<MaterialCommunityIcons name="tag-outline" size={20} color={theme.colors.secondary} />
          <Text style={styles.detailLabel}>Frequency:</Text>
          <Text style={styles.detailValue}>{subscription.planFrequency}</Text>
        </View>
         <View style={styles.detailRow}>
<MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.tertiary} />
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={subscription.status === 'paused' ? styles.statusPaused : styles.statusActive}>
              {subscription.status}
          </Text>
        </View>
        
        {/* --- Pause/Resume Actions --- */}
        <Divider style={styles.divider} />
        {subscription.status === 'active' && (
          <>
            <Text style={styles.pauseInfo}>Need a break? Pause this subscription.</Text>
            <Button
                mode="contained"
                onPress={() => onPausePress(subscription)} // Pass the specific sub
                icon="calendar-month-outline"
                style={styles.actionButton}
            >
                Pause Service
            </Button>
          </>
        )}
        {subscription.status === 'paused' && (
          <>
            <Text style={styles.pauseInfo}>Your service is currently paused.</Text>
            <Button
                mode="contained"
                onPress={() => onResumePress(subscription)} // Pass the specific sub
                icon="calendar-play"
                style={styles.actionButton}
            >
                Resume Service
            </Button>
         </>
        )}
      </Card.Content>
    </Card>
  );
};
// --- *** END OF CARD COMPONENT *** ---


export const SubscriptionScreen = () => {
  // --- THIS IS THE FIX ---
  const { user } = useAuth(); // Removed the extra '}'
  // -----------------------
  const theme = useTheme();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [pauseRange, setPauseRange] = useState<{ startDate: Date | undefined; endDate: Date | undefined }>({ startDate: undefined, endDate: undefined });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [subToPause, setSubToPause] = useState<Subscription | null>(null);

  // --- Data Fetching (Updated) ---
  const fetchSubscriptions = useCallback(async () => {
    if (!user) { setLoading(false); setError('You must be logged in.'); return; }
    setLoading(true); setError(null); setSubscriptions([]);
    
    const { subscriptions: fetchedSubscriptions, error: fetchError } =
      await getUserActiveSubscriptions(user.uid);
      
    if (fetchError) {
      if (fetchError.includes('index')) {
        setError(fetchError);
      } else {
        setError('Failed to load subscriptions.');
      }
      setSubscriptions([]);
    } else {
      setSubscriptions(fetchedSubscriptions || []);
    }
    setLoading(false);
  }, [user]);

  // --- useFocusEffect ---
  useFocusEffect(
    useCallback(() => {
      fetchSubscriptions();
    }, [fetchSubscriptions])
  );

  // --- Renewal Reminder ---
  useEffect(() => {
    const checkAndScheduleReminders = async () => {
      if (!subscriptions || subscriptions.length === 0) return;
      for (const sub of subscriptions) {
        if (sub.status !== 'active') continue;
        const { id: subId, endDate: subEndDate } = sub;
        const reminderKey = `${REMINDER_STORAGE_KEY_PREFIX}${subId}`;
        const reminderSent = await AsyncStorage.getItem(reminderKey);
        if (reminderSent) continue;
        const endDate = subEndDate.toDate();
        const now = new Date();
        const daysUntilRenewal = differenceInDays(endDate, now);
        if (daysUntilRenewal <= 3 && daysUntilRenewal >= 0) {
          const reminderDate = subDays(endDate, 1);
          reminderDate.setHours(9, 0, 0, 0);
          if (reminderDate > now) {
            console.log(`[Notifications] Scheduling renewal reminder for sub ${subId}`);
            await scheduleLocalNotification(
              'Subscription Renewal Reminder 📅',
              `Your "${sub.planName}" subscription will renew in 1 day.`,
              reminderDate
            );
            await AsyncStorage.setItem(reminderKey, 'true');
          }
        }
      }
    };
    checkAndScheduleReminders();
  }, [subscriptions]);

  // --- Pause/Resume Logic ---
  const handlePausePress = (subscription: Subscription) => {
    setSubToPause(subscription);
    setDatePickerVisible(true);
  };

  const handleResumePress = async (subscription: Subscription) => {
    if (!subscription.id) return;
    setIsUpdatingStatus(true);
    const { success, error: updateError } = await updateSubscriptionStatus(
        subscription.id, 'active', null, 0
    );
    setIsUpdatingStatus(false);
    if (success) {
      Alert.alert("Success", "Subscription resumed.");
      fetchSubscriptions();
    } else {
      Alert.alert("Error", updateError || "Failed to resume subscription.");
    }
  };

  const onConfirmPauseDates = useCallback(
    ({ startDate, endDate }: { startDate: Date | undefined; endDate: Date | undefined }) => {
      setDatePickerVisible(false);
      if (!subToPause) return;
      if (startDate && endDate && subToPause.id) {
        const daysPaused = differenceInCalendarDays(endDate, startDate) + 1;
        if (daysPaused <= 0) {
            Alert.alert("Invalid Range", "End date must be on or after start date.");
            return;
        }
        Alert.alert(
          "Confirm Pause",
          `Pause "${subToPause.planName}" from ${format(startDate, 'MMM d')} to ${format(endDate, 'MMM d')} (${daysPaused} days)?`,
          [
            { text: "Cancel", style: "cancel", onPress: () => setSubToPause(null) },
            {
              text: "Confirm Pause",
              onPress: () => handlePauseConfirm(subToPause.id, endDate, daysPaused),
            },
          ]
        );
      } else {
        Alert.alert("Error", "Please select both a start and end date.");
      }
    },
    [subToPause, fetchSubscriptions] // Add fetchSubscriptions
  );

  const handlePauseConfirm = async (subId: string, pauseUntilDate: Date, daysPaused: number) => {
    setIsUpdatingStatus(true);
    const { success, error: updateError } = await updateSubscriptionStatus(
        subId, 'paused', pauseUntilDate, daysPaused
    );
    setIsUpdatingStatus(false);
    setSubToPause(null);
    if (success) {
      Alert.alert("Success", "Subscription paused. Your renewal date has been updated.");
      fetchSubscriptions();
    } else {
      Alert.alert("Error", updateError || "Failed to pause subscription.");
    }
  };

  // --- Render States ---
  if (loading) {
    return <ActivityIndicator animating={true} style={styles.loader} size="large" />;
  }
  if (error) {
     return (
        <View style={styles.centerContainer}>
            <Text style={styles.errorText} selectable={true}>{error}</Text>
            {error.includes('index') && (
                <Text style={styles.emptyText}>Please ask the administrator to create the required database index.</Text>
            )}
        </View>
     );
  }
  if (subscriptions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="calendar-remove-outline" size={20} color={theme.colors.error} />
        <Text style={styles.emptyText}>You have no active subscriptions.</Text>
        <Text style={styles.emptySubText}>Subscribe to a plan from the "Browse" tab.</Text>
      </View>
    );
  }

  // --- Render List of Subscriptions ---
  return (
    <>
      <FlatList
        data={subscriptions}
        renderItem={({ item }) => (
          <SubscriptionCard
            subscription={item}
            onPausePress={handlePausePress}
            onResumePress={handleResumePress}
          />
        )}
        keyExtractor={(item) => item.id}
        style={styles.container}
        ListHeaderComponent={
          <Text variant='headlineSmall' style={styles.listHeader}>My Active Subscriptions</Text>
        }
        refreshing={isUpdatingStatus}
        onRefresh={fetchSubscriptions}
      />

      <DatePickerModal
         locale="en"
         mode="range"
         visible={isDatePickerVisible}
         onDismiss={() => { setDatePickerVisible(false); setSubToPause(null); }}
         startDate={pauseRange.startDate}
         endDate={pauseRange.endDate}
         onConfirm={onConfirmPauseDates}
         validRange={{ startDate: new Date() }}
      />
    </>
  );
};

// --- PREMIUM UPDATED STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  // Loading & Empty
  centerContainer: {
    flex: 1,
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
    color: "red",
    fontSize: 16,
    marginBottom: 10,
  },

  emptyText: {
    textAlign: "center",
    fontSize: 18,
    color: "#777",
    marginTop: 16,
    fontWeight: "600",
  },

  emptySubText: {
    textAlign: "center",
    fontSize: 14,
    color: "lightgray",
    marginTop: 8,
  },

  // Header
  listHeader: {
    fontSize: 22,
    fontWeight: "800",
    color: "#222",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
  },

  // Subscription Card
  card: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 5,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },

  kitchenName: {
    fontSize: 16,
    color: "#555",
    marginBottom: 12,
    fontWeight: "600",
  },

  divider: {
    marginVertical: 12,
    height: 1,
    backgroundColor: "#EEE",
  },

  // Detail Rows
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  detailLabel: {
    fontSize: 15,
    color: "#444",
    marginLeft: 8,
    flex: 1,
    fontWeight: "600",
  },

  detailValue: {
    fontSize: 15,
    color: "#222",
    fontWeight: "600",
  },

  // Status styles
  statusActive: {
    color: "#2E7D32",
    fontWeight: "bold",
    textTransform: "capitalize",
    textAlign: "right",
    fontSize: 18,
  },

  statusPaused: {
    color: "#FB8C00",
    fontWeight: "bold",
    textTransform: "capitalize",
    textAlign: "right",
    fontSize: 15,
  },

  pauseInfo: {
    marginBottom: 14,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },

  // Premium Action Button
  actionButton: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#e53935",

    elevation: 3,
    shadowColor: "#e53935",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
