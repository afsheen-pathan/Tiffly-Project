// src/services/adminUserService.ts
import { collection, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Type for basic customer data needed in the list
export interface CustomerData {
  id: string; // User ID (Document ID)
  email: string;
  name?: string; // Optional name field from user profile
  createdAt?: Timestamp | null; // Firestore Timestamp type or null if not set
}

// Function to fetch all users with the 'customer' role
export const getAllCustomers = async (): Promise<{ customers: CustomerData[]; error?: string }> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'customer'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const customerList: CustomerData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      customerList.push({
        id: doc.id,
        email: data.email,
        name: data.name || 'N/A',
        createdAt: data.createdAt,
      });
    });

    console.log(`Fetched ${customerList.length} customers.`);
    return { customers: customerList };

  } catch (error: unknown) { // <-- FIX HERE
    console.error("Error fetching customers:", error);
    let errorMessage = 'Failed to load customer data.';
    // Safely check for FirebaseError properties
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'failed-precondition' && 'message' in error) {
       const indexUrlMatch = (error as { message: string }).message.match(/(https:\/\/[^\s]+)/);
       errorMessage = `Index required: ${indexUrlMatch ? indexUrlMatch[0] : 'Check Console'}`;
    } else if (error instanceof Error) {
       errorMessage = error.message;
    }
    return { customers: [], error: errorMessage };
  }
};

// Type for provider data needed in the list
export interface ProviderListData {
  id: string; // User ID (Document ID)
  kitchenName: string;
  providerFullName: string;
  city: string;
  status: string; // 'approved', 'suspended', 'deactivated'
  createdAt?: Timestamp | null;
}

// Type for subscription transaction data
export interface SubscriptionTransactionData {
  id: string; // Subscription Doc ID
  userId: string;
  providerId: string;
  planName: string;
  planFrequency: 'Weekly' | 'Monthly';
  endDate: Timestamp;
  status: string; // 'active', 'paused', 'cancelled', 'trialing'
  createdAt: Timestamp;
  pricePaid?: number; // The total amount the customer paid (in Rupees)
}

// --- MODIFIED FUNCTION ---
// Function to fetch all providers with 'approved', 'suspended', or 'deactivated' status
export const getAllApprovedProviders = async (): Promise<{ providers: ProviderListData[]; error?: string }> => {
  try {
    const providersRef = collection(db, 'providerProfiles');
    // Update Query: Fetch 'approved', 'suspended', AND 'deactivated'
    const q = query(
      providersRef,
      where('status', 'in', ['approved', 'suspended', 'deactivated']),
      orderBy('createdAt', 'desc') // Order by creation date
    );
    const querySnapshot = await getDocs(q);

    const providerList: ProviderListData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Ensure required fields exist before pushing
      if (data.kitchenName && data.providerFullName && data.city) {
          providerList.push({
            id: doc.id,
            kitchenName: data.kitchenName,
            providerFullName: data.providerFullName,
            city: data.city,
            status: data.status,
            createdAt: data.createdAt,
          });
      } else {
          console.warn(`Skipping provider ${doc.id} due to missing fields.`);
      }
    });

    console.log(`Fetched ${providerList.length} approved/suspended/deactivated providers.`);
    return { providers: providerList };

  } catch (error: unknown) {
     console.error("Error fetching providers:", error);
    let errorMessage = 'Failed to load provider data.';
     if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'failed-precondition' && 'message' in error) {
         const indexUrlMatch = (error as { message: string }).message.match(/(https:\/\/[^\s]+)/);
         errorMessage = `Index required: ${indexUrlMatch ? indexUrlMatch[0] : 'Check Console'}`;
     } else if (error instanceof Error) {
         errorMessage = error.message;
     }
     return { providers: [], error: errorMessage };
  }
};
// --- END MODIFICATION ---

// Type for all possible provider statuses
export type ProviderStatus = 'pending' | 'pending_approval' | 'approved' | 'rejected' | 'suspended' | 'deactivated';

// Function to set any provider status
export const setProviderStatus = async (
  providerId: string,
  newStatus: ProviderStatus
): Promise<{ success: boolean; error?: string }> => {
  try {
    const providerDocRef = doc(db, 'providerProfiles', providerId);
    await updateDoc(providerDocRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    console.log(`Provider ${providerId} status updated to ${newStatus}`);
    return { success: true };
  } catch (error) {
    console.error(`Error updating provider ${providerId} status:`, error);
    return { success: false, error: 'Failed to update provider status.' };
  }
};

// Type for subscription data needed in the admin list
export interface ActiveSubscriptionData {
  id: string; // Subscription Doc ID
  userId: string;
  providerId: string;
  planName: string;
  planFrequency: 'Weekly' | 'Monthly';
  endDate: Timestamp; // Already stored Timestamp
  status: string; // 'active'
  createdAt?: Timestamp | null;
}

// Function to fetch all subscriptions with 'active' status
export const getAllActiveSubscriptions = async (): Promise<{ subscriptions: ActiveSubscriptionData[]; error?: string }> => {
  try {
    const subsRef = collection(db, 'subscriptions');
    const q = query(
      subsRef,
      where('status', '==', 'active'),
      orderBy('endDate', 'asc') // Order by next renewal date
    );
    const querySnapshot = await getDocs(q);

    const subscriptionList: ActiveSubscriptionData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId && data.providerId && data.planName && data.endDate) {
          subscriptionList.push({
            id: doc.id,
            userId: data.userId,
            providerId: data.providerId,
            planName: data.planName,
            planFrequency: data.planFrequency,
            endDate: data.endDate,
            status: data.status,
            createdAt: data.createdAt,
          });
      } else {
          console.warn(`Skipping subscription ${doc.id} due to missing fields.`);
      }
    });

    console.log(`Fetched ${subscriptionList.length} active subscriptions.`);
    return { subscriptions: subscriptionList };

  } catch (error: unknown) { // <-- FIX HERE
     console.error("Error fetching transactions:", error);
     let errorMessage = 'Failed to load transaction data.';
     if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'failed-precondition' && 'message' in error) {
         const indexUrlMatch = (error as { message: string }).message.match(/(https:\/\/[^\s]+)/);
         errorMessage = `Index required: ${indexUrlMatch ? indexUrlMatch[0] : 'Check Console'}`;
     } else if (error instanceof Error) {
        errorMessage = error.message;
     }
     return { subscriptions: [], error: errorMessage };
  }
};

// Function to fetch ALL completed subscriptions (transactions)
export const getAllTransactions = async (): Promise<{ transactions: SubscriptionTransactionData[]; error?: string }> => {
  try {
    const subsRef = collection(db, 'subscriptions');
    // Query for all subscriptions that are NOT 'pending' (i.e., payment completed)
    const q = query(
      subsRef,
      where('status', '!=', 'pending'), // Get all active, paused, trialing, etc.
      orderBy('createdAt', 'desc') // Show most recent first
    );
    const querySnapshot = await getDocs(q);

    const transactionList: SubscriptionTransactionData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Ensure it has a price before adding to transaction list
      if (data.pricePaid !== undefined && data.pricePaid !== null) {
          transactionList.push({
            id: doc.id,
            userId: data.userId,
            providerId: data.providerId,
            planName: data.planName,
            planFrequency: data.planFrequency,
            endDate: data.endDate,
            status: data.status,
            createdAt: data.createdAt,
            pricePaid: data.pricePaid,
          });
      }
    });

    console.log(`Fetched ${transactionList.length} transactions.`);
    return { transactions: transactionList };

  } catch (error: unknown) { // <-- FIX HERE
     console.error("Error fetching transactions:", error);
     let errorMessage = 'Failed to load transaction data.';
     if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'failed-precondition' && 'message' in error) {
         const indexUrlMatch = (error as { message: string }).message.match(/(https:\/\/[^\s]+)/);
         errorMessage = `Index required: ${indexUrlMatch ? indexUrlMatch[0] : 'Check Console'}`;
     } else if (error instanceof Error) {
         errorMessage = error.message;
     }
     return { transactions: [], error: errorMessage };
  }
};
// --- END ADD ---