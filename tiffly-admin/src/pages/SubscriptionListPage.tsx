// src/pages/SubscriptionListPage.tsx

import { useState, useEffect } from "react";
import { getAllActiveSubscriptions } from "../services/adminUserService";
import type { ActiveSubscriptionData } from "../services/adminUserService";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

export const SubscriptionListPage = () => {
  const [subscriptions, setSubscriptions] = useState<ActiveSubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch list once */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const { subscriptions: list, error: fetchError } = await getAllActiveSubscriptions();

      if (fetchError) setError(fetchError);
      else setSubscriptions(list);

      setLoading(false);
    };

    fetchData();
  }, []);

  /** Format timestamp */
  const formatDate = (ts: any): string => {
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
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">All Active Subscriptions</h1>
        <p className="text-sm text-gray-500">
          View all active meal subscriptions across the platform.
        </p>
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-600 text-sm">Loading subscriptions...</p>}

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
                  "Customer ID",
                  "Provider ID",
                  "Plan Name",
                  "Frequency",
                  "Next Renewal",
                  "Status",
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
              {subscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500 text-sm"
                  >
                    No active subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-gray-50 transition-all duration-150"
                  >
                    {/* CUSTOMER ID */}
                    <td
                      className="px-6 py-4 text-sm text-gray-600"
                      title={sub.userId}
                    >
                      {sub.userId.substring(0, 8)}...
                    </td>

                    {/* PROVIDER ID */}
                    <td
                      className="px-6 py-4 text-sm text-gray-600"
                      title={sub.providerId}
                    >
                      {sub.providerId.substring(0, 8)}...
                    </td>

                    {/* PLAN NAME */}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {sub.planName}
                    </td>

                    {/* FREQUENCY */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sub.planFrequency}
                    </td>

                    {/* NEXT RENEWAL */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(sub.endDate)}
                    </td>

                    {/* STATUS BADGE */}
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex rounded-full bg-green-50 px-2 py-1 text-xs font-semibold leading-5 text-green-700">
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
