// src/services/adminFoodReportService.ts
import { collection, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Type for the food report data
export interface FoodReport {
  id: string; // Firestore document ID
  providerId: string;
  kitchenName: string;
  providerAddress: string;
  providerPhone: string;
  foodDescription: string;
  quantity: string;
  pickupByTime: string;
  status: 'new' | 'handled';
  createdAt: Timestamp;
}

// Function to fetch food reports by status
export const getFoodReportsByStatus = async (
  status: 'new' | 'handled'
): Promise<{ reports: FoodReport[]; error?: string }> => {
  try {
    const reportsRef = collection(db, 'foodReports');
    const q = query(
      reportsRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc') // Show newest first
    );
    const querySnapshot = await getDocs(q);

    const reportList: FoodReport[] = [];
    querySnapshot.forEach((doc) => {
      // Type assertion as we expect data to match
      reportList.push({ id: doc.id, ...doc.data() } as FoodReport);
    });

    console.log(`Fetched ${reportList.length} '${status}' food reports.`);
    return { reports: reportList };

  } catch (error: unknown) {
     console.error(`Error fetching '${status}' reports:`, error);
     let errorMessage = 'Failed to load reports.';
     // Check for index error
     if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'failed-precondition' && 'message' in error) {
         const indexUrlMatch = (error as { message: string }).message.match(/(https:\/\/[^\s]+)/);
         errorMessage = `Index required: ${indexUrlMatch ? indexUrlMatch[0] : 'Check Console'}`;
     } else if (error instanceof Error) {
         errorMessage = error.message;
     }
     return { reports: [], error: errorMessage };
  }
};

// Function to update a report's status to 'handled'
export const markFoodReportAsHandled = async (
  reportId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const reportDocRef = doc(db, 'foodReports', reportId);
    await updateDoc(reportDocRef, {
      status: 'handled',
      updatedAt: serverTimestamp(),
    });
    console.log(`Marked food report ${reportId} as handled.`);
    return { success: true };
  } catch (error: unknown) {
    console.error(`Error marking report ${reportId} as handled:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
};