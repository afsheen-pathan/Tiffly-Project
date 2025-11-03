// src/services/notificationService.ts
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc, serverTimestamp, collection, addDoc, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import Constants from 'expo-constants';

// --- 1. Function to get permission and the token ---
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  let token: string | null = null;
  if (!Device.isDevice) {
    console.log('[Notifications] Must use physical device for Push Notifications.');
    return null;
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    console.log('[Notifications] Asking for push notification permission...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission denied.');
    Alert.alert('Permission Denied', 'You will not receive notifications. You can enable them in your phone settings.');
    return null;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
        console.error("!!! [Notifications] 'projectId' is missing from app.json 'extra.eas' config !!!");
        Alert.alert("Error", "Notification service is not configured. Missing Project ID.");
        return null;
    }
    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    token = pushTokenData.data;
    console.log('[Notifications] Expo Push Token received:', token);
  } catch (e) {
    console.error('[Notifications] Failed to get push token:', e);
  }
  return token;
};

// --- 2. Function to save the token to Firestore ---
export const savePushTokenToUser = async (userId: string, token: string): Promise<void> => {
  if (!userId || !token) return;
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      pushToken: token,
      updatedAt: serverTimestamp(),
    });
    console.log(`[Notifications] Saved push token for user: ${userId}`);
  } catch (error) {
    console.error(`[Notifications] Error saving push token:`, error);
  }
};

// --- 3. Function to SEND a Push Notification ---
export const sendPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> => {
  if (!expoPushToken || typeof expoPushToken !== 'string' || !expoPushToken.startsWith('ExponentPushToken')) {
    console.error(`[Notifications] Invalid Expo push token: ${expoPushToken}`);
    return;
  }
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data || {},
  };
  console.log(`[Notifications] Sending push notification to ${expoPushToken}`);
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    console.log(`[Notifications] Notification sent successfully.`);
  } catch (error) {
    console.error('[Notifications] Error sending push notification:', error);
  }
};

// --- 4. Function to create inbox message ---
export const createNotification = async (
  userId: string,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string }> => {
  if (!userId) {
    console.error('[Notifications] Cannot create notification: userId is missing.');
    return { success: false, error: 'User ID missing.' };
  }
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId: userId,
      title: title,
      body: body,
      createdAt: serverTimestamp(),
      isRead: false,
    });
    console.log(`[Notifications] Inbox message created for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('[Notifications] Error creating inbox message:', error);
    return { success: false, error: 'Failed to save notification.' };
  }
};

// --- 5. Function to mark notifications as read ---
export const markNotificationsAsRead = async (userId: string): Promise<void> => {
  if (!userId) return;
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return;
    const batch = writeBatch(db);
    querySnapshot.forEach(docSnap => {
      batch.update(docSnap.ref, { isRead: true });
    });
    await batch.commit();
    console.log(`[Notifications] Marked ${querySnapshot.size} notifications as read for user ${userId}`);
  } catch (error) {
    console.error('[Notifications] Error marking notifications as read:', error);
  }
};

// --- 6. *** UPDATED FUNCTION for Local Scheduling *** ---
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  triggerDate: Date
): Promise<string | null> => {
  try {
    const now = new Date();
    if (triggerDate < now) {
      console.log('[Notifications] Cannot schedule notification in the past.');
      return null;
    }

    // Calculate the number of seconds from now until the triggerDate
    const seconds = Math.round((triggerDate.getTime() - now.getTime()) / 1000);

    if (seconds <= 0) {
      console.log('[Notifications] Trigger date is too close to now, not scheduling.');
      return null;
    }

    console.log(`[Notifications] Scheduling local notification in ${seconds} seconds (at ${triggerDate.toISOString()})`);
    
    // Schedule the notification using a seconds trigger
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: 'default',
      },
      trigger: { seconds }, // Use the calculated seconds
    });
    
    console.log(`[Notifications] Notification scheduled with ID: ${identifier}`);
    return identifier;
  } catch (error) {
    console.error('[Notifications] Error scheduling local notification:', error);
    return null;
  }
};
// --- *** END UPDATED FUNCTION *** ---