// src/pages/TransactionListPage.tsx
import { useState, useEffect, useMemo } from "react";
import { getAllTransactions } from "../services/adminUserService";
import type { SubscriptionTransactionData } from "../services/adminUserService";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

// Currency Format
const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

export const TransactionListPage = () => {
  const [transactions, setTransactions] = useState<SubscriptionTransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const { transactions: list, error: fetchErr } = await getAllTransactions();
      if (fetchErr) setError(fetchErr);
      else setTransactions(list);

      setLoading(false);
    };

    fetchData();
  }, []);

  // Memoized Total Revenue
  const totalPlatformRevenue = useMemo(() => {
    return transactions.reduce((acc, t) => acc + (t.pricePaid || 0) * 0.1, 0);
  }, [transactions]);

  // Date Format Helper
  const formatDate = (ts: any) => {
    try {
      let date: Date;
      if (!ts) return "N/A";

      if (ts instanceof Timestamp) date = ts.toDate();
      else if (ts instanceof Date) date = ts;
      else date = new Date(String(ts));

      return isNaN(date.getTime()) ? "Invalid Date" : format(date, "MMM d, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">All Transactions</h1>
        <p className="text-sm text-gray-500">Platform revenue and payment breakdown.</p>
      </div>

      {/* Revenue Card */}
      <div className="mb-6 rounded-xl bg-green-50 border border-green-100 p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-medium text-green-700">
          Total Platform Revenue (10%)
        </h2>

        {loading ? (
          <p className="animate-pulse text-gray-400 text-lg">Loading...</p>
        ) : (
          <p className="text-3xl font-bold text-green-700">
            {formatCurrency(totalPlatformRevenue)}
          </p>
        )}

        <p className="mt-1 text-xs text-gray-500">
          Based on {transactions.length} total transactions.
        </p>
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-600 text-sm">Loading transactions...</p>}

      {/* Firestore Index Error */}
      {error?.includes("index") && (
        <div className="my-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-700 shadow-sm">
          <strong>Firestore Index Required:</strong>
          <p>{error}</p>
        </div>
      )}

      {/* Other Errors */}
      {error && !error.includes("index") && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">

            {/* TABLE HEADER */}
            <thead className="bg-gray-50/70">
              <tr>
                {[
                  "Date",
                  "Plan Name",
                  "Total Paid",
                  "Platform Revenue (10%)",
                  "Provider Share (90%)",
                  "Provider ID",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody className="bg-white divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-gray-500"
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const total = t.pricePaid || 0;
                  const platformRevenue = total * 0.1;
                  const providerShare = total * 0.9;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50 transition-all duration-150"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(t.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {t.planName}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                        {formatCurrency(total)}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-green-700">
                        {formatCurrency(platformRevenue)}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatCurrency(providerShare)}
                      </td>

                      <td
                        className="px-6 py-4 text-sm text-gray-500"
                        title={t.providerId}
                      >
                        {t.providerId.substring(0, 8)}...
                      </td>
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
