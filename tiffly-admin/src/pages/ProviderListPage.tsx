// src/pages/ProviderListPage.tsx

import { useState, useEffect, useCallback } from "react";
import {
  getAllApprovedProviders,
  setProviderStatus,
} from "../services/adminUserService";
import type { ProviderListData, ProviderStatus } from "../services/adminUserService";
import { format } from "date-fns";
import { Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { ProviderDetailsModal } from "../components/ProviderDetailsModal";

/** Full profile type for modal */
export type FullProviderProfileData = {
  id: string;
  providerFullName: string;
  kitchenName: string;
  kitchenImageUrl: string;
  phoneNumber: string;
  kitchenDescription: string;
  streetAddress: string;
  city: string;
  pincode: string;
  cuisineType: string;
  maxCapacity: string;
  fssaiLicenseNumber?: string;
  status: string;
  createdAt: Timestamp;
};

export const ProviderListPage = () => {
  const [providers, setProviders] = useState<ProviderListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProvider, setSelectedProvider] =
    useState<FullProviderProfileData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  /** Load full profile for modal */
  const openDetailsModal = async (providerSummary: ProviderListData) => {
    setModalError(null);
    setModalLoading(true);

    try {
      const ref = doc(db, "providerProfiles", providerSummary.id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setModalError("Full provider profile not found.");
        setModalLoading(false);
        return;
      }

      const data = snap.data();

      const fullProvider: FullProviderProfileData = {
        id: snap.id,
        providerFullName: data.providerFullName ?? providerSummary.providerFullName,
        kitchenName: data.kitchenName ?? providerSummary.kitchenName,
        kitchenImageUrl: data.kitchenImageUrl ?? "",
        phoneNumber: data.phoneNumber ?? "",
        kitchenDescription: data.kitchenDescription ?? "",
        streetAddress: data.streetAddress ?? "",
        city: data.city ?? providerSummary.city,
        pincode: data.pincode ?? "",
        cuisineType: data.cuisineType ?? "",
        maxCapacity: data.maxCapacity ?? "",
        fssaiLicenseNumber: data.fssaiLicenseNumber ?? undefined,
        status: data.status ?? providerSummary.status ?? "approved",
        createdAt: data.createdAt ?? providerSummary.createdAt ?? Timestamp.now(),
      };

      setSelectedProvider(fullProvider);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to load provider details:", err);
      setModalError("Failed to load provider details.");
    } finally {
      setModalLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setSelectedProvider(null);
    setIsModalOpen(false);
    setModalError(null);
  };

  /** Fetch provider list */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { providers: list, error: err } = await getAllApprovedProviders();
    if (err) setError(err);
    else setProviders(list);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Status update */
  const handleStatusChange = async (providerId: string, newStatus: ProviderStatus) => {
    let msg = `Are you sure you want to ${newStatus} this provider?`;
    if (newStatus === "deactivated") msg += "\n\nThis action is permanent.";

    if (!window.confirm(msg)) return;

    const { error: updateErr } = await setProviderStatus(providerId, newStatus);
    if (updateErr) alert(`Failed: ${updateErr}`);
    else {
      alert(`Provider updated to ${newStatus}`);
      fetchData();
    }
  };

  /** Format date */
  const formatDate = (ts: unknown) => {
    try {
      let d: Date | null = null;
      if (ts instanceof Timestamp) d = ts.toDate();
      else if (ts instanceof Date) d = ts;
      else if (typeof ts === "number") d = new Date(ts);
      else if (typeof ts === "string") d = new Date(ts);

      return d && !isNaN(d.getTime()) ? format(d, "MMM d, yyyy") : "Invalid";
    } catch {
      return "Invalid";
    }
  };

  return (
    <div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          All Providers (Approved, Suspended, Deactivated)
        </h1>
        <p className="text-sm text-gray-500">
          Manage all registered providers on the platform.
        </p>
      </div>

      {loading && <p className="text-gray-600">Loading providers...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl bg-white border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">

            <thead className="bg-gray-50">
              <tr>
                {[
                  "Details",
                  "Kitchen Name",
                  "Provider Name",
                  "City",
                  "Joined On",
                  "Rating",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50 transition">

                  {/* View btn */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openDetailsModal(provider)}
                      className="rounded-md bg-indigo-50 text-indigo-700 px-3 py-1 text-xs font-semibold hover:bg-indigo-100 transition whitespace-nowrap"
                    >
                      View
                    </button>
                  </td>

                  {/* Kitchen */}
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {provider.kitchenName}
                  </td>

                  {/* Provider */}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {provider.providerFullName}
                  </td>

                  {/* City */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {provider.city}
                  </td>

                  {/* Joined */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(provider.createdAt)}
                  </td>

                  {/* Rating */}
                  <td className="px-6 py-4 text-sm font-medium">
                    {provider.averageRating ? (
                      <span className="text-green-700 font-semibold whitespace-nowrap">
                        ⭐ {provider.averageRating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400">New</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                        provider.status === "approved"
                          ? "bg-green-50 text-green-700"
                          : provider.status === "suspended"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {provider.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">

                      {provider.status === "approved" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusChange(provider.id, "suspended")
                            }
                            className="rounded-md bg-amber-50 text-amber-700 px-3 py-1 text-xs font-semibold hover:bg-amber-100 transition"
                          >
                            Suspend
                          </button>

                          <button
                            onClick={() =>
                              handleStatusChange(provider.id, "deactivated")
                            }
                            className="rounded-md bg-red-50 text-red-700 px-3 py-1 text-xs font-semibold hover:bg-red-100 transition"
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
                          className="rounded-md bg-green-50 text-green-700 px-3 py-1 text-xs font-semibold hover:bg-green-100 transition"
                        >
                          Reactivate
                        </button>
                      )}

                      {provider.status === "deactivated" && (
                        <span className="text-xs text-red-700 font-medium">
                          No Actions
                        </span>
                      )}

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedProvider && (
        <ProviderDetailsModal provider={selectedProvider} onClose={closeDetailsModal} />
      )}

      {modalLoading && <p className="mt-3 text-gray-600">Loading details...</p>}
      {modalError && <p className="mt-3 text-red-500">{modalError}</p>}
    </div>
  );
};
