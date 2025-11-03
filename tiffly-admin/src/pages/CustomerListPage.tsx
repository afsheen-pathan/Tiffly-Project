// src/pages/CustomerListPage.tsx
import { useState, useEffect } from 'react';
import { getAllCustomers } from '../services/adminUserService'; // Import function
import type { CustomerData } from '../services/adminUserService'; // Type-only import
import { format } from 'date-fns'; // For formatting dates

export const CustomerListPage = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const { customers: fetchedCustomers, error: fetchError } = await getAllCustomers();
      if (fetchError) {
        setError(fetchError);
      } else {
        setCustomers(fetchedCustomers);
      }
      setLoading(false);
    };
    fetchData();
  }, []); // Fetch once on mount

  // Helper to format Firestore Timestamp or Date
  const formatDate = (timestamp: unknown): string => {
    if (!timestamp) return 'N/A';
    try {
      let date: Date;
        
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'object' && timestamp !== null) {
        const ts = timestamp as { toDate?: unknown };
        if (typeof ts.toDate === 'function') {
          date = ts.toDate() as Date;
        } else {
          date = new Date(String(timestamp));
        }
      } else {
        date = new Date(String(timestamp));
      }

      if (Number.isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };


  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">All Customers</h1>

      {loading && <p>Loading customers...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Joined On</th>
                {/* Add more columns if needed (e.g., Address, Phone) */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No customers found.</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{customer.email}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(customer.createdAt)}</td>
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