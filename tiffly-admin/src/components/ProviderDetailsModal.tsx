// src/components/ProviderDetailsModal.tsx
import type { Provider } from '../pages/PendingProvidersPage'; // Import the Provider type

interface ProviderDetailsModalProps {
  provider: Provider;
  onClose: () => void;
}

// Helper component to display each detail item
const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="mb-3">
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className="text-sm text-gray-900">{value || '-'}</p>
  </div>
);

export const ProviderDetailsModal = ({ provider, onClose }: ProviderDetailsModalProps) => {
  if (!provider) return null;

  return (
    // Modal backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose} // Close modal on backdrop click
    >
      {/* Modal content */}
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-semibold text-gray-800">Provider Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            {/* Simple X icon */}
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Provider Details Grid */}
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <DetailItem label="Provider Name (Private)" value={provider.providerFullName} />
          <DetailItem label="Kitchen Name (Public)" value={provider.kitchenName} />
          <DetailItem label="Phone (Private)" value={provider.phoneNumber} />
          <DetailItem label="City" value={provider.city} />
          <DetailItem label="Address" value={provider.streetAddress} />
          <DetailItem label="Pincode" value={provider.pincode} />
          <DetailItem label="Cuisine Type" value={provider.cuisineType} />
          <DetailItem label="Max Capacity" value={provider.maxCapacity} />
          <DetailItem label="FSSAI License (Optional)" value={provider.fssaiLicenseNumber} />
        </div>

        {/* Description */}
        <div className="mt-4 border-t pt-4">
          <DetailItem label="Kitchen Description" value={provider.kitchenDescription} />
        </div>

        {/* Image */}
        {provider.kitchenImageUrl && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500">Kitchen Image</p>
            <img
              src={provider.kitchenImageUrl}
              alt="Kitchen"
              className="mt-1 h-48 w-full rounded-md object-cover"
            />
          </div>
        )}

        {/* Close button at bottom (optional) */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};