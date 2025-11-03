// src/pages/FoodReportPage.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  getFoodReportsByStatus,
  markFoodReportAsHandled,
} from '../services/adminFoodReportService';
import type { FoodReport } from '../services/adminFoodReportService';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export const FoodReportPage = () => {
  const [reports, setReports] = useState<FoodReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch reports, wrapped in useCallback
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    // We only fetch 'new' reports for this page
    const { reports: fetchedReports, error: fetchError } = await getFoodReportsByStatus('new');
    if (fetchError) {
      setError(fetchError);
    } else {
      setReports(fetchedReports);
    }
    setLoading(false);
  }, []);

  // Fetch data when the component mounts
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handler for the "Mark as Handled" button
  const handleMarkAsHandled = async (reportId: string) => {
    if (!window.confirm('Are you sure you have handled this food report?')) {
      return;
    }

    const { error: updateError } = await markFoodReportAsHandled(reportId);
    if (updateError) {
      alert(`Failed: ${updateError}`);
    } else {
      alert('Report marked as handled.');
      // Refresh the list by removing the item locally
      setReports(prevReports => prevReports.filter(report => report.id !== reportId));
    }
  };

  // Helper to format date
  const formatDate = (timestamp: unknown): string => {
    if (!timestamp) return 'N/A';
    try {
      let date: Date;
      if (timestamp instanceof Timestamp) { date = timestamp.toDate(); }
      else if (timestamp instanceof Date) { date = timestamp; }
      else { date = new Date(String(timestamp)); }
      if (Number.isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'MMM d, yyyy h:mm a'); // Show time as well
    } catch { return 'Invalid Date'; }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">New Food Waste Reports</h1>

      {loading && <p>Loading reports...</p>}
      {error?.includes('index') && (
           <div className="my-4 rounded border border-yellow-400 bg-yellow-100 p-4 text-yellow-700">
             <p className="font-bold">Action Required:</p>
             <p>{error}</p>
             <p className="mt-2">Please create the required Firestore index and refresh.</p>
           </div>
       )}
       {error && !error.includes('index') && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kitchen Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contact / Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Food Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pickup By</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reported On</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No new food reports.</td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{report.kitchenName}</td>
                    <td className="whitespace-pre-wrap px-6 py-4 text-sm text-gray-500">
                      <p>{report.providerPhone}</p>
                      <p>{report.providerAddress}</p>
                    </td>
                    <td className="whitespace-pre-wrap px-6 py-4 text-sm text-gray-500">{report.foodDescription}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{report.quantity}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-red-600">{report.pickupByTime}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(report.createdAt)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => handleMarkAsHandled(report.id)}
                        className="rounded bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 hover:bg-green-200"
                      >
                        Mark as Handled
                      </button>
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