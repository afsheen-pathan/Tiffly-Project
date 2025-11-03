// src/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { auth } from '../config/firebase';
import { User } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  UserCredential 
} from 'firebase/auth';
import { SignInData } from '../services/userService';
// 1. Import the new notification functions
import { 
  registerForPushNotificationsAsync, 
  savePushTokenToUser 
} from '../services/notificationService';

// Context shape: includes functions
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: SignInData) => Promise<UserCredential | { error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = (useState(false)); // We only use this for login

  // This is our manual signIn function
  const signIn = async (data: SignInData) => {
    setLoading(true);
    try {
      // Use the firebase function
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      setUser(userCredential.user); // Manually set the user
      setLoading(false);

      // --- 2. ADD NOTIFICATION LOGIC ---
      try {
        console.log('[Notifications] User logged in, registering for push token...');
        const token = await registerForPushNotificationsAsync(); // Get token
        if (token) {
          // Save the token to their Firestore user document
          await savePushTokenToUser(userCredential.user.uid, token);
        }
      } catch (e) {
        // This should not stop the login flow
        console.error('[Notifications] Error during token registration:', e);
      }
      // --- END NOTIFICATION LOGIC ---

      return userCredential;
    } catch (error: any) {
      console.error("Error signing in (Context):", error);
      setLoading(false);
      return { error };
    }
  };

  // This is our manual signOut function
  const signOut = async () => {
    try {
      // TODO: We could also remove the push token from Firestore here
      // to stop sending notifications to a logged-out device.
      // For now, we'll just log them out.
      await firebaseSignOut(auth);
      setUser(null); // Manually clear the user
    } catch (error) {
      console.error("Error signing out (Context):", error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// The hook is the same
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContext');
  }
  return context;
};