// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { auth } from '../config/firebase';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, // 1. Import this listener
  UserCredential 
} from 'firebase/auth';
import { SignInData } from '../services/userService';
import { 
  registerForPushNotificationsAsync, 
  savePushTokenToUser 
} from '../services/notificationService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: SignInData) => Promise<UserCredential | { error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // 2. Start loading as TRUE so we can check for a saved user first
  const [loading, setLoading] = useState(true); 

  // --- 3. ADD THIS EFFECT: Listen for auth state changes ---
  useEffect(() => {
    console.log("[Auth] Checking for saved user...");
    // This function runs automatically on startup and whenever auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("[Auth] User restored:", currentUser.uid);
        setUser(currentUser);
      } else {
        console.log("[Auth] No user found.");
        setUser(null);
      }
      setLoading(false); // Done checking
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  // -------------------------------------------------------

  const signIn = async (data: SignInData) => {
    // We don't need to set loading here, because onAuthStateChanged will trigger
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      // Note: setUser is handled automatically by the listener above now!
      
      // Notification logic
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await savePushTokenToUser(userCredential.user.uid, token);
        }
      } catch (e) {
        console.error('[Auth] Token error:', e);
      }

      return userCredential;
    } catch (error: any) {
      console.error("Error signing in:", error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // setUser(null) is handled automatically by the listener
    } catch (error) {
      console.error("Error signing out:", error);
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContext');
  }
  return context;
};