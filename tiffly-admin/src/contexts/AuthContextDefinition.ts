// src/contexts/AuthContextDefinition.ts
import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type { SignInData } from '../services/adminAuthService';

// Define the type for the context value
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: SignInData) => Promise<{ user?: User; error?: unknown }>;
  signOut: () => Promise<void>;
}

// Create and export the context itself
export const AuthContext = createContext<AuthContextType | undefined>(undefined);