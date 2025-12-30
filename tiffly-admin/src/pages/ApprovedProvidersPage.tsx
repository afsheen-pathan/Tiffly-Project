// src/pages/ApprovedProvidersPage.tsx

import { useState, useEffect, useCallback } from "react";
import {
  getAllApprovedProviders,
  setProviderStatus,
} from "../services/adminUserService";
import type { ProviderListData, ProviderStatus } from "../services/adminUserService";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";

export const ApprovedProvidersPage = () => {
  const [providers, setProviders] = useState<ProviderListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch data with useCallback */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { providers: data, error: fetchError } = await getAllApprovedProviders();

    if (fetchError) setError(fetchError);
    else setProviders(data);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Format date helper */
  const formatDate = (ts: any) => {
    try {
      let date: Date;

      if (ts instanceof Timestamp) date = ts.toDate();
      else if (ts instanceof Date) date = ts;
      else date = new Date(String(ts));

      return isNaN(date.getTime()) ? "Invalid Date" : format(date, "MMM d, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  /** Change provider status */
  const handleStatusChange = async (providerId: string, newStatus: ProviderStatus) => {
    let confirmText = `Are you sure you want to ${newStatus} this provider?`;

    if (newStatus === "deactivated") {
      confirmText +=
        "\n\nThis removes them permanently from customer view. Proceed?";
    }

    if (!window.confirm(confirmText)) return;

    const { success, error: updateError } = await setProviderStatus(
      providerId,
      newStatus
    );

    if (!success) alert(updateError);
    else {
      alert(`Provider updated to ${newStatus}.`);
      fetchData();
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Manage Providers</h1>
        <p className="text-sm text-gray-500">
          View and manage all Approved, Suspended, and Deactivated providers.
        </p>
      </div>

      {loading && (
        <p className="text-gray-600 text-sm">Loading provider list...</p>
      )}

      {error && (
        <div className="my-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error.includes("index") && <strong>Firestore Index Required:</strong>}
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            {/* TABLE HEADER */}
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Kitchen Name",
                  "Provider Name",
                  "City",
                  "Status",
                  "Actions",
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
              {providers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-6 text-center text-gray-500"
                  >
                    No providers found.
                  </td>
                </tr>
              ) : (
                providers.map((pr) => (
                  <tr
                    key={pr.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {pr.kitchenName}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pr.providerFullName}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pr.city}
                    </td>

                    {/* STATUS BADGE */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          pr.status === "approved"
                            ? "bg-green-50 text-green-700"
                            : pr.status === "suspended"
                            ? "bg-amber-50 text-amber-700"
                            : pr.status === "deactivated"
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {pr.status}
                      </span>
                    </td>

                    {/* ACTION BUTTONS */}
                    <td className="px-6 py-4 text-sm font-medium space-x-2">

                      {/* APPROVED → Suspend or Deactivate */}
                      {pr.status === "approved" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(pr.id, "suspended")}
                            className="rounded-lg bg-amber-50 text-amber-700 px-3 py-1 text-xs font-semibold hover:bg-amber-100 transition"
                          >
                            Suspend
                          </button>

                          <button
                            onClick={() => handleStatusChange(pr.id, "deactivated")}
                            className="rounded-lg bg-red-50 text-red-700 px-3 py-1 text-xs font-semibold hover:bg-red-100 transition"
                          >
                            Deactivate
                          </button>
                        </>
                      )}

                      {/* SUSPENDED → Reactivate */}
                      {pr.status === "suspended" && (
                        <button
                          onClick={() => handleStatusChange(pr.id, "approved")}
                          className="rounded-lg bg-green-50 text-green-700 px-3 py-1 text-xs font-semibold hover:bg-green-100 transition"
                        >
                          Reactivate
                        </button>
                      )}

                      {/* DEACTIVATED → No actions */}
                      {pr.status === "deactivated" && (
                        <span className="text-xs text-red-700 font-medium">
                          No Actions
                        </span>
                      )}
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
