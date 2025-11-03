// src/pages/TransactionListPage.tsx
import { useState, useEffect, useMemo } from 'react'; // Import useMemo
import { getAllTransactions } from '../services/adminUserService';
import type { SubscriptionTransactionData } from '../services/adminUserService'; // Use the correct type
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return `₹${amount.toFixed(2)}`;
};

export const TransactionListPage = () => {
  const [transactions, setTransactions] = useState<SubscriptionTransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const { transactions: fetchedTransactions, error: fetchError } = await getAllTransactions();
      if (fetchError) {
        setError(fetchError);
      } else {
        setTransactions(fetchedTransactions);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // --- Calculate Total Revenue using useMemo ---
  const totalPlatformRevenue = useMemo(() => {
    return transactions.reduce((acc, sub) => {
      const price = sub.pricePaid || 0;
      const commission = price * 0.10; // Calculate 8% commission
      return acc + commission;
    }, 0);
  }, [transactions]); // Recalculate only when transactions change
  // ------------------------------------------

  const formatDate = (timestamp: unknown): string => {
    if (!timestamp) return 'N/A';
    try {
      let date: Date;
      if (timestamp instanceof Timestamp) { date = timestamp.toDate(); }
      else if (timestamp instanceof Date) { date = timestamp; }
      else { date = new Date(String(timestamp)); }
      if (Number.isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'MMM d, yyyy');
    } catch { return 'Invalid Date'; }
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-800">All Transactions</h1>

      {/* --- Revenue Summary Card --- */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-2 text-sm font-medium text-gray-500">Total Platform Revenue (10%)</h2>
        {loading ? (
           <p className="animate-pulse text-gray-400">Loading...</p>
        ) : (
           <p className="text-3xl font-bold text-green-600">
             {formatCurrency(totalPlatformRevenue)}
           </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Based on {transactions.length} total transactions.
        </p>
      </div>
      {/* --- End Card --- */}


      {loading && <p>Loading transactions...</p>}
      {/* Index error display */}
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Plan Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Platform Revenue (10%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Provider Share (90%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Provider ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No transactions found.</td>
                </tr>
              ) : (
                transactions.map((sub) => {
                  const totalPaid = sub.pricePaid || 0;
                  const platformRevenue = totalPaid * 0.10;
                  const providerShare = totalPaid * 0.90; // Calculate 90%
                  return (
                    <tr key={sub.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(sub.createdAt)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{sub.planName}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-700">{formatCurrency(totalPaid)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-green-600">{formatCurrency(platformRevenue)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatCurrency(providerShare)}</td>
                       <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500" title={sub.providerId}>{sub.providerId.substring(0, 8)}...</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};