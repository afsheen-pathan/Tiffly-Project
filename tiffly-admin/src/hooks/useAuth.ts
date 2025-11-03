// src/hooks/useAuth.ts
import { useContext } from 'react';
// Import AuthContext (value) normally
import { AuthContext } from '../contexts/AuthContextDefinition';
// Import AuthContextType (type) using 'import type'
import type { AuthContextType } from '../contexts/AuthContextDefinition'; // <-- FIX HERE

export const useAuth = () => {
  const context = useContext<AuthContextType | undefined>(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};