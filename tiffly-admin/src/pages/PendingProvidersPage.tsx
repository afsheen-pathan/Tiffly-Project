// src/pages/PendingProvidersPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { triggerNotification } from '../services/adminNotificationService';
import { setProviderStatus } from '../services/adminUserService';
import { ProviderDetailsModal } from '../components/ProviderDetailsModal'; // Import the modal

// Define the full provider profile data type for the modal
// This must match the structure in your Firestore 'providerProfiles' collection
export type FullProviderProfileData = {
  id: string; // This is the doc ID, which is the User ID
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
  // Add any other fields that are part of the document
};

// Define the type for the modal, which might be slightly different
// For simplicity, we'll use FullProviderProfileData for both list and modal
// but we cast it to 'any' for the modal prop if types mismatch.
// Let's try to align them properly.
// The modal expects 'Provider', let's rename our type.
export type Provider = FullProviderProfileData;


export const PendingProvidersPage = () => {
  const [providers, setProviders] = useState<Provider[]>([]); // Use Provider type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for the modal
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to fetch providers, wrapped in useCallback
  const fetchPendingProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const providersRef = collection(db, 'providerProfiles');
      const q = query(providersRef, where('status', '==', 'pending_approval'));
      const querySnapshot = await getDocs(q);

      const pendingList: Provider[] = [];
      querySnapshot.forEach((doc) => {
        // We need all data for the modal
        pendingList.push({ id: doc.id, ...doc.data() } as Provider);
      });
      setProviders(pendingList);
    } catch (err: unknown) {
      console.error("Error fetching pending providers:", err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load provider data: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array, function is stable

  // Fetch data when the component mounts
  useEffect(() => {
    fetchPendingProviders();
  }, [fetchPendingProviders]); // Call it

  // --- UPDATED Approve/Reject Functions ---
  const handleApprove = async (provider: Provider) => {
    const { success, error: updateError } = await setProviderStatus(provider.id, 'approved');
    
    if (success) {
      alert(`Provider ${provider.kitchenName} approved successfully!`);
      
      // --- SEND NOTIFICATION ---
      console.log(`[Admin] Triggering 'Account Approved' notification for ${provider.id}`);
      const title = 'Your Account is Approved! ✅';
      const body = `Congratulations, ${provider.providerFullName}! Your kitchen "${provider.kitchenName}" is now active. You can log in to set up your menu.`;
      
      // Call the service (don't need to await, let it run in background)
      triggerNotification(provider.id, title, body);
      // -------------------------

      // Refresh list by removing the provider locally
      setProviders(prevProviders => prevProviders.filter(p => p.id !== provider.id));
    } else {
      alert(`Failed to approve provider: ${updateError}`);
    }
  };

  const handleReject = async (providerId: string) => {
    if (!window.confirm('Are you sure you want to reject this provider? This cannot be undone.')) {
      return;
    }
    
    const { success, error: updateError } = await setProviderStatus(providerId, 'rejected');
    if (success) {
      alert('Provider rejected.');
      // Refresh list
      setProviders(prevProviders => prevProviders.filter(p => p.id !== providerId));
    } else {
      alert(`Failed to reject provider: ${updateError}`);
    }
  };
  // ---------------------------------------------

  // --- Modal functions ---
  const openDetailsModal = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };
  const closeDetailsModal = () => {
    setIsModalOpen(false);
    setSelectedProvider(null);
  };
  // -----------------------

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Pending Provider Approvals</h1>

      {loading && <p>Loading providers...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kitchen Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Provider Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {providers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No providers waiting for approval.</td>
                </tr>
              ) : (
                providers.map((provider) => (
                  <tr key={provider.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                       <button
                         onClick={() => openDetailsModal(provider)}
                         className="rounded bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-200"
                       >
                         View
                       </button>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{provider.kitchenName}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{provider.providerFullName}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{provider.city}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => handleApprove(provider)} // Pass the full provider object
                        className="mr-3 rounded bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 hover:bg-green-200"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(provider.id)}
                        className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-200"
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
      
      {/* Render the Modal */}
      {isModalOpen && selectedProvider && (
        // The type 'Provider' matches what the modal expects
        <ProviderDetailsModal provider={selectedProvider} onClose={closeDetailsModal} />
      )}
    </div>
  );
};