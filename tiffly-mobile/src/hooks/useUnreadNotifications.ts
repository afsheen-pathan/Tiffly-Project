// src/hooks/useUnreadNotifications.ts
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useUnreadNotifications = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0); // No user, no unread messages
      return;
    }

    // Create a query to find unread notifications for this user
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('isRead', '==', false) // Only count unread
    );

    // Set up a real-time listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        // The size of the snapshot is the number of unread documents
        const count = querySnapshot.size;
        console.log(`[Notifications] Unread count updated: ${count}`);
        setUnreadCount(count);
      },
      (error) => {
        // Handle errors (e.g., missing index)
        console.error("[Notifications] Error listening to unread count:", error);
        // You might need to create a Firestore index for this query
      }
    );

    // Cleanup: Unsubscribe when the hook/component unmounts
    return () => unsubscribe();
  }, [user]); // Re-run if the user changes

  return unreadCount; // Return the count
};