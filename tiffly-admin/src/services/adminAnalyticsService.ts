// src/services/adminAnalyticsService.ts
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { subDays, startOfDay } from 'date-fns';

// --- Type for Subscription Data (used by Line Chart) ---
export interface SubscriptionChartData {
  id: string;
  createdAt: Timestamp;
  status: string;
  pricePaid?: number; // Include pricePaid for revenue calculation
}

// --- Function 1: Subscription Revenue Line Chart ---
export const getRecentSubscriptions = async (days = 30): Promise<{ data: SubscriptionChartData[]; error?: string }> => {
  try {
    const subsRef = collection(db, 'subscriptions');
    const startDate = startOfDay(subDays(new Date(), days));
    const startTimestamp = Timestamp.fromDate(startDate);
    
    // Query for subscriptions created in the date range that have been paid
    const q = query(
      subsRef,
      where('createdAt', '>=', startTimestamp),
      where('status', '!=', 'pending'), // Ensure it's a completed transaction
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const list: SubscriptionChartData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt && data.createdAt instanceof Timestamp) {
        list.push({
          id: doc.id,
          createdAt: data.createdAt,
          status: data.status,
          pricePaid: data.pricePaid, // Pass pricePaid
        });
      }
    });
    console.log(`[Analytics] Fetched ${list.length} recent subscriptions for revenue chart.`);
    return { data: list };
  } catch (error: unknown) {
     console.error("[Analytics] Error fetching recent subscriptions:", error);
     let errorMessage = 'Failed chart data.';
     if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
         const firebaseError = error as { code: string; message: string };
         if (firebaseError.code === 'failed-precondition') {
             const indexUrlMatch = firebaseError.message.match(/(https:\/\/[^\s]+)/);
             errorMessage = `Index required: ${indexUrlMatch ? indexUrlMatch[0] : 'Check Console'}`;
         } else {
             errorMessage = firebaseError.message;
         }
     } else if (error instanceof Error) { errorMessage = error.message; }
     return { data: [], error: errorMessage };
  }
};

// --- Type and Function 2: Cuisine Pie Chart ---
export interface CuisineDistributionData {
    name: string; // Cuisine Type (e.g., 'North Indian')
    value: number; // Count of providers
}

export const getProviderCuisineDistribution = async (): Promise<{ data: CuisineDistributionData[]; error?: string }> => {
    try {
        const providersRef = collection(db, 'providerProfiles');
        const q = query(providersRef, where('status', '==', 'approved'));
        const querySnapshot = await getDocs(q);
        const counts: { [cuisine: string]: number } = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const cuisine = data.cuisineType || 'Unknown';
            counts[cuisine] = (counts[cuisine] || 0) + 1;
        });
        const distributionData: CuisineDistributionData[] = Object.entries(counts).map(([name, value]) => ({
            name,
            value,
        }));
        console.log(`[Analytics] Fetched cuisine distribution:`, distributionData);
        return { data: distributionData };
    } catch (error: unknown) {
        console.error("[Analytics] Error fetching cuisine distribution:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return { data: [], error: `Failed to load cuisine data: ${message}` };
    }
};

// --- Type and Function 3: Frequency Bar Chart ---
export interface SubscriptionFrequencyData {
    name: 'Weekly' | 'Monthly' | 'Other';
    count: number;
}

export const getSubscriptionFrequencyCounts = async (): Promise<{ data: SubscriptionFrequencyData[]; error?: string }> => {
    try {
        const subsRef = collection(db, 'subscriptions');
        const q = query(subsRef, where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        let weeklyCount = 0;
        let monthlyCount = 0;
        let otherCount = 0;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const freq = data.planFrequency?.toLowerCase();
            if (freq === 'weekly') { weeklyCount++; }
            else if (freq === 'monthly') { monthlyCount++; }
            else { otherCount++; }
        });
        const frequencyData: SubscriptionFrequencyData[] = [
            { name: 'Weekly', count: weeklyCount },
            { name: 'Monthly', count: monthlyCount },
        ];
        if (otherCount > 0) {
            frequencyData.push({ name: 'Other', count: otherCount });
        }
        console.log(`[Analytics] Fetched subscription frequency counts:`, frequencyData);
        return { data: frequencyData };
    } catch (error: unknown) {
        console.error("[Analytics] Error fetching subscription frequency:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return { data: [], error: `Failed to load frequency data: ${message}` };
    }
};