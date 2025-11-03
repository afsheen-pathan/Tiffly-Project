// src/contexts/AuthContext.tsx
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { auth } from '../config/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { signInAdmin, signOutAdmin } from '../services/adminAuthService';
import type { SignInData } from '../services/adminAuthService';
// Import the context and type definition from the separate file
import { AuthContext } from './AuthContextDefinition';
import type { AuthContextType } from './AuthContextDefinition';

// This file now ONLY exports the AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (data: SignInData) => {
    try {
      const result = await signInAdmin(data);
      if (result.user) {
        setUser(result.user);
      }
      return result;
    } catch (error: unknown) {
      console.error("Caught error during sign in:", error);
      return { error };
    }
  };

  const signOut = async () => {
    await signOutAdmin();
    setUser(null);
  };

  // Ensure the value matches the AuthContextType
  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    // Use the imported AuthContext here
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};