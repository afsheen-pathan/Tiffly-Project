// src/pages/PendingProvidersPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { triggerNotification } from '../services/adminNotificationService';
import { setProviderStatus } from '../services/adminUserService';
import { ProviderDetailsModal } from '../components/ProviderDetailsModal';

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

export type Provider = FullProviderProfileData;

export const PendingProvidersPage = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPendingProviders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const ref = collection(db, 'providerProfiles');
      const q = query(ref, where('status', '==', 'pending_approval'));
      const snap = await getDocs(q);

      const list: Provider[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Provider));

      setProviders(list);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err);
      } else {
        console.error(String(err));
      }
      setError("Failed to load provider data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingProviders();
  }, [fetchPendingProviders]);

  const handleApprove = async (provider: Provider) => {
    const { success, error: errMsg } = await setProviderStatus(provider.id, 'approved');

    if (success) {
      alert(`Provider ${provider.kitchenName} approved successfully!`);

      triggerNotification(
        provider.id,
        "Your Account is Approved! 🎉",
        `Hello ${provider.providerFullName}, your kitchen "${provider.kitchenName}" is now active!`
      );

      setProviders((prev) => prev.filter((p) => p.id !== provider.id));
    } else {
      alert(`Failed: ${errMsg}`);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Are you sure you want to reject this provider?")) return;

    const { success, error: errMsg } = await setProviderStatus(id, 'rejected');

    if (success) {
      alert("Provider rejected.");
      setProviders((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert("Error rejecting provider: " + errMsg);
    }
  };

  const openDetailsModal = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setSelectedProvider(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Pending Provider Approvals
      </h1>

      {loading && <p className="text-gray-600">Loading providers...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Kitchen Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Provider Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {providers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No providers waiting for approval.
                  </td>
                </tr>
              ) : (
                providers.map((provider) => (
                  <tr
                    key={provider.id}
                    className="hover:bg-gray-50 transition"
                  >
                    {/* View Button */}
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => openDetailsModal(provider)}
                        className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                      >
                        View
                      </button>
                    </td>

                    {/* Kitchen Name */}
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {provider.kitchenName}
                    </td>

                    {/* Provider Name */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {provider.providerFullName}
                    </td>

                    {/* City */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {provider.city}
                    </td>

                    {/* Approve / Reject Buttons */}
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => handleApprove(provider)}
                        className="mr-3 rounded-lg bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => handleReject(provider.id)}
                        className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && selectedProvider && (
        <ProviderDetailsModal provider={selectedProvider} onClose={closeDetailsModal} />
      )}
    </div>
  );
};
