// src/pages/SubscriptionListPage.tsx
import { useState, useEffect } from 'react';
import { getAllActiveSubscriptions } from '../services/adminUserService'; // Import function
import type { ActiveSubscriptionData } from '../services/adminUserService'; // Type-only import
import { format } from 'date-fns'; // For formatting dates
import { Timestamp } from 'firebase/firestore'; // Import Timestamp type

export const SubscriptionListPage = () => {
  const [subscriptions, setSubscriptions] = useState<ActiveSubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const { subscriptions: fetchedSubscriptions, error: fetchError } = await getAllActiveSubscriptions();
      if (fetchError) {
        setError(fetchError);
      } else {
        setSubscriptions(fetchedSubscriptions);
      }
      setLoading(false);
    };
    fetchData();
  }, []); // Fetch once on mount

  // Helper to format Firestore Timestamp or Date
  const formatDate = (timestamp: unknown): string => {
    if (!timestamp) return 'N/A';
    try {
      let date: Date;
      // Check if it's a Firestore Timestamp object
      if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
      }
      // Check if it's already a JS Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Fallback for other potential formats
      else {
        date = new Date(String(timestamp));
      }
      // Check if the resulting date is valid
      if (Number.isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'MMM d, yyyy'); // Format as 'Oct 25, 2025'
    } catch (e) {
      console.error("Error formatting date:", timestamp, e);
      return 'Invalid Date';
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">All Active Subscriptions</h1>

      {loading && <p>Loading subscriptions...</p>}
      {/* Display index error prominently */}
      {error?.includes('index') && (
           <div className="my-4 rounded border border-yellow-400 bg-yellow-100 p-4 text-yellow-700">
             <p className="font-bold">Action Required:</p>
             <p>{error}</p>
             <p className="mt-2">Please create the required Firestore index and refresh.</p>
           </div>
       )}
      {/* Display other errors */}
       {error && !error.includes('index') && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Provider ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Plan Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Next Renewal</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No active subscriptions found.</td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500" title={sub.userId}>{sub.userId.substring(0, 8)}...</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500" title={sub.providerId}>{sub.providerId.substring(0, 8)}...</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{sub.planName}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{sub.planFrequency}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(sub.endDate)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};