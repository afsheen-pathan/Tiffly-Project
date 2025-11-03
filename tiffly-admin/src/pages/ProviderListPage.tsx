// src/pages/ProviderListPage.tsx
import { useState, useEffect, useCallback } from "react";
import {
  getAllApprovedProviders,
  setProviderStatus,
} from "../services/adminUserService";
// 1. Use 'import type' for the type definitions
import type {
  ProviderListData,
  ProviderStatus,
} from "../services/adminUserService";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore"; // Import Timestamp for formatDate helper

export const ProviderListPage = () => {
  const [providers, setProviders] = useState<ProviderListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { providers: fetchedProviders, error: fetchError } =
      await getAllApprovedProviders();
    if (fetchError) {
      setError(fetchError);
    } else {
      setProviders(fetchedProviders);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler for changing status
  const handleStatusChange = async (
    providerId: string,
    newStatus: ProviderStatus
  ) => {
    let confirmMessage = `Are you sure you want to ${newStatus} this provider?`;
    if (newStatus === "deactivated") {
      confirmMessage += "\n\nWARNING: This action is permanent!";
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    // 2. Remove unused 'success' variable
    const { error: updateError } = await setProviderStatus(
      providerId,
      newStatus
    );
    if (updateError) {
      alert(`Failed: ${updateError}`);
    } else {
      alert(`Provider status updated to ${newStatus}.`);
      fetchData(); // Refresh the list
    }
  };

  // Helper to format Firestore Timestamp or Date
  const formatDate = (timestamp: unknown): string => {
    if (!timestamp) return "N/A";
    try {
      let date: Date;
      if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(String(timestamp));
      }
      if (Number.isNaN(date.getTime())) return "Invalid Date";
      return format(date, "MMM d, yyyy");
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">
        All Providers (Approved, Suspended, Deactivated)
      </h1>

      {loading && <p>Loading providers...</p>}
      {/* ... (Error display logic) ... */}
      {error?.includes("index") && (
        <div className="my-4 rounded border border-yellow-400 bg-yellow-100 p-4 text-yellow-700">
          <p className="font-bold">Action Required:</p>
          <p>{error}</p>
          <p className="mt-2">
            Please create the required Firestore index and refresh.
          </p>
        </div>
      )}
      {error && !error.includes("index") && (
        <p className="text-red-500">{error}</p>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Kitchen Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Provider Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Joined On
                </th>{" "}
                {/* 3. Renamed column for clarity */}
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {providers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No providers found.
                  </td>
                </tr>
              ) : (
                providers.map((provider) => (
                  <tr key={provider.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {provider.kitchenName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {provider.providerFullName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {provider.city}
                    </td>
                    {/* 4. Call the formatDate function here */}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(provider.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          provider.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : provider.status === "suspended"
                            ? "bg-yellow-100 text-yellow-800"
                            : provider.status === "deactivated"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {provider.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      {provider.status === "approved" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusChange(provider.id, "suspended")
                            }
                            className="mr-3 rounded bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 hover:bg-yellow-200"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(provider.id, "deactivated")
                            }
                            className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-200"
                          >
                            Deactivate
                          </button>
                        </>
                      )}
                      {provider.status === "suspended" && (
                        <button
                          onClick={() =>
                            handleStatusChange(provider.id, "approved")
                          }
                          className="rounded bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 hover:bg-green-200"
                        >
                          Reactivate
                        </button>
                      )}
                      {provider.status === "deactivated" && (
                        <span className="text-xs font-medium text-red-700">
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
