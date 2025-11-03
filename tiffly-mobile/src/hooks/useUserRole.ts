// src/hooks/useUserRole.ts
import { useState, useEffect, useCallback } from 'react'; // Add useCallback
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

type UserRole = 'customer' | 'provider' | 'admin' | null;
type ProviderStatus = 'pending' | 'pending_approval' | 'approved' | 'rejected' | 'suspended' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>(null);
  const [loading, setLoading] = useState(true);

  // 1. Wrap the fetch logic in useCallback
  const fetchUserData = useCallback(async (currentUser: any) => {
    setLoading(true);
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userRole = userData.role as UserRole;
          setRole(userRole);

          if (userRole === 'provider') {
            const providerDocRef = doc(db, 'providerProfiles', currentUser.uid);
            const providerDoc = await getDoc(providerDocRef);
            if (providerDoc.exists()) {
              setProviderStatus(providerDoc.data().status as ProviderStatus);
            } else {
              setProviderStatus(null);
            }
          }
        } else {
          setRole(null);
        }
      } catch (err) {
        setRole(null);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []); // Empty dependency array

  // 2. Call it on mount
  useEffect(() => {
    fetchUserData(user);
  }, [user, fetchUserData]);

  // 3. Create a simple refetch function
  const refetch = () => {
    if (user) {
      fetchUserData(user);
    }
  };

  // 4. Return the role, status, loading, AND the refetch function
  return { role, providerStatus, loading, refetch };
};