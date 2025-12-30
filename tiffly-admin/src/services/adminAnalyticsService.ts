// src/services/adminAnalyticsService.ts
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  orderBy
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import { subDays, startOfDay } from 'date-fns';

// --- 1. Subscription Line Chart ---
export interface SubscriptionChartData {
  id: string;
  createdAt: Timestamp;
  status: string;
  pricePaid?: number;
}

export const getRecentSubscriptions = async (days = 30): Promise<{ data: SubscriptionChartData[]; error?: string }> => {
  try {
    const subsRef = collection(db, 'subscriptions');
    const startDate = startOfDay(subDays(new Date(), days));
    const startTimestamp = Timestamp.fromDate(startDate);
    
    const q = query(
      subsRef,
      where('createdAt', '>=', startTimestamp),
      where('status', '!=', 'pending'),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const list: SubscriptionChartData[] = [];
    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      if (data.createdAt && data.createdAt instanceof Timestamp) {
        list.push({
          id: doc.id,
          createdAt: data.createdAt,
          status: data.status,
          pricePaid: data.pricePaid,
        });
      }
    });
    console.log(`[Analytics] Fetched ${list.length} recent subscriptions.`);
    return { data: list };
  } catch (error: unknown) {
     console.error("[Analytics] Error fetching recent subscriptions:", error);
     let errorMessage = 'Failed chart data.';
     if (error instanceof Error) errorMessage = error.message;
     return { data: [], error: errorMessage };
  }
};

// --- 2. Cuisine Pie Chart ---
export interface CuisineDistributionData {
    name: string;
    value: number;
}

export const getProviderCuisineDistribution = async (): Promise<{ data: CuisineDistributionData[]; error?: string }> => {
    try {
        const providersRef = collection(db, 'providerProfiles');
        const q = query(providersRef, where('status', '==', 'approved'));
        const querySnapshot = await getDocs(q);
        const counts: { [cuisine: string]: number } = {};
        
        querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            // Normalize the cuisine name (trim spaces, handle consistent casing if needed)
            const cuisine = data.cuisineType ? data.cuisineType.trim() : 'Unknown';
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

// --- 3. Frequency Bar Chart ---
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
        querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
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
        console.log(`[Analytics] Fetched frequency counts:`, frequencyData);
        return { data: frequencyData };
    } catch (error: unknown) {
        console.error("[Analytics] Error fetching frequency:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return { data: [], error: `Failed to load frequency data: ${message}` };
    }
};

// --- 4. Revenue Split Pie Chart ---
export interface RevenueSplitData {
  name: string;
  value: number;
}

export const getTotalRevenueSplit = async (): Promise<{ data: RevenueSplitData[]; error?: string }> => {
  try {
    const subsRef = collection(db, 'subscriptions');
    // Note: 'pricePaid' > 0 requires an index if combined with other filters
    const q = query(subsRef, where('pricePaid', '>', 0));
    const querySnapshot = await getDocs(q);
    let totalRevenue = 0;
    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      totalRevenue += (doc.data().pricePaid || 0) as number;
    });
    
    const providerPayout = parseFloat((totalRevenue * 0.90).toFixed(2));
    const platformRevenue = parseFloat((totalRevenue * 0.08).toFixed(2));
    
    const revenueData: RevenueSplitData[] = [
      { name: 'Provider Payouts (90%)', value: providerPayout },
      { name: 'Platform Revenue (8%)', value: platformRevenue },
    ];
    console.log(`[Analytics] Fetched revenue split:`, revenueData);
    return { data: revenueData };
  } catch (error: unknown) {
     console.error("[Analytics] Error fetching revenue split:", error);
     const message = error instanceof Error ? error.message : "Unknown error";
     return { data: [], error: `Failed to load revenue data: ${message}` };
  }
};